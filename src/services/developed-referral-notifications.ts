import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { listActiveUsers } from './google-users.js';
import { isGeneral, norm, uniqueEmails, sendEmail, savePlatformNotifications } from './notification-service.js';
import { buildXlsx } from './simple-xlsx.js';

/* Same wording/behaviour as the legacy licences' referral e-mail («إحالة التراخيص الأسبوعي | <الإدارة>»), for the developed licences,
   plus an Excel copy of the referred licences of that department attached to the e-mail. */
const COLUMNS: Array<[string, (r: any) => unknown]> = [
  ['رقم الرخصة', (r) => r.license_number],
  ['رقم أمر الإغلاق', (r) => pick(r, 'رقم أمر الإغلاق')],
  ['اسم المقاول', (r) => r.contractor || pick(r, 'اسم المقاول')],
  ['اسم الاستشاري', (r) => r.consultant || pick(r, 'اسم الاستشاري')],
  ['اسم المشروع', (r) => pick(r, 'اسم المشروع')],
  ['اسم الجهة المشرفة / الجهة المالكة', (r) => pick(r, 'اسم الجهة المشرفة / الجهة المالكة') || r.owner_entity],
  ['اسم الشارع', (r) => pick(r, 'اسم الشارع') || r.route_name],
  ['الحي', (r) => pick(r, 'الحي')],
  ['حالة طلب الإغلاق', (r) => r.closure_request_status || pick(r, 'حالة طلب الإغلاق')],
  ['تاريخ طلب الإغلاق', (r) => pick(r, 'تاريخ طلب الإغلاق')],
  ['انتهاء فترة المعالجة', (r) => fmtDeadline(r.processing_deadline) || pick(r, 'انتهاء فترة المعالجة')],
  ['إحداثيات الموقع', (r) => pick(r, 'إحداثيات الموقع') || (r.latitude != null && r.longitude != null ? `${r.latitude}, ${r.longitude}` : '')],
  ['الإدارة', (r) => r.department]
];
const pick = (r: any, key: string) => {
  const v = r.raw_payload?.[key] ?? r.extra_payload?.[key];
  return v == null || typeof v === 'object' ? '' : String(v).trim();
};
const fmtDeadline = (v: unknown) => {
  if (!v) return '';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + 3 * 3600_000).toISOString().replace('T', ' ').slice(0, 16);
};
const cellText = (v: unknown) => (v == null ? '' : String(v).trim());

export async function notifyDevelopedReferral(licenseNumbers: string[], actorEmail = '', reminder = false) {
  const numbers = [...new Set(licenseNumbers.map((n) => String(n).trim()).filter(Boolean))];
  if (!numbers.length) return { ok: true, departments: [], recipients: 0, sent: 0, platform: 0 };

  const q = await pool.query(
    `SELECT l.license_number, l.department, l.contractor, l.consultant, l.owner_entity, l.route_name, l.latitude, l.longitude,
            l.closure_request_status, l.processing_deadline, l.extra_payload, s.raw_payload
       FROM developed_licenses.licenses l
       LEFT JOIN developed_licenses.source_licenses s ON s.license_number = l.license_number
      WHERE l.license_number = ANY($1::text[])
      ORDER BY l.department, l.license_number`,
    [numbers]
  );
  const grouped = new Map<string, any[]>();
  for (const row of q.rows) {
    const dept = String(row.department || 'الإدارة المختصة').trim() || 'الإدارة المختصة';
    (grouped.get(dept) || grouped.set(dept, []).get(dept)!).push(row);
  }

  const users = await listActiveUsers();
  let sent = 0;
  let platform = 0;
  let recipientsCount = 0;
  const details: any[] = [];

  for (const [department, rows] of grouped) {
    const recipients = users
      .filter((u) => norm(u.email) !== norm(actorEmail))
      .filter((u) => isGeneral(u) || (u.licenseDepartments || []).some((a) => norm(a) === norm(department)))
      .map((u) => u.email);

    const remainingResult = await pool.query(
      `SELECT COUNT(*)::bigint count FROM developed_licenses.licenses
        WHERE dependency = 'تابع' AND department = $1 AND status IN ('تحت الإجراء','تحت الاجراء') AND NOT (license_number = ANY($2::text[]))`,
      [department, numbers]
    );
    const remaining = Number(remainingResult.rows[0]?.count || 0);

    let subject = `${config.NOTIFICATION_LICENSE_SUBJECT || 'إحالة التراخيص الأسبوعي'} | ${department}`;
    let topText = `نفيدكم بأنه تم إحالة التراخيص الأسبوعية ضمن نطاق ${department}.`;
    let bottomText = (config.NOTIFICATION_LICENSE_BODY || 'نأمل منكم الاطلاع واتخاذ اللازم، مع العلم بأن إغلاق التراخيص مرتبط بمدة زمنية.').trim();
    let body = `${topText}\nعدد الرخص المحالة: ${rows.length}\n${remaining > 0 ? `الرخص التي لاتزال تحت الإجراء: ${remaining}\n` : ''}${bottomText}`.trim();
    let pendingCount = rows.length;
    let attachRows: any[] = rows;

    if (reminder) {
      // Reminder: all licences of this department still under action + the nearest processing deadline.
      const pend = await pool.query(
        `SELECT COUNT(*)::bigint AS cnt, MIN(processing_deadline) FILTER (WHERE processing_deadline > now()) AS next_deadline
           FROM developed_licenses.licenses
          WHERE dependency = 'تابع' AND department = $1 AND status IN ('تحت الإجراء','تحت الاجراء')`,
        [department]
      );
      pendingCount = Math.max(Number(pend.rows[0]?.cnt || 0), rows.length);
      const all = await pool.query(
        `SELECT l.license_number, l.department, l.contractor, l.consultant, l.owner_entity, l.route_name, l.latitude, l.longitude,
                l.closure_request_status, l.processing_deadline, l.extra_payload, s.raw_payload
           FROM developed_licenses.licenses l
           LEFT JOIN developed_licenses.source_licenses s ON s.license_number = l.license_number
          WHERE l.dependency = 'تابع' AND l.department = $1 AND l.status IN ('تحت الإجراء','تحت الاجراء')
          ORDER BY l.processing_deadline NULLS LAST, l.license_number`,
        [department]
      );
      if (all.rows.length) { attachRows = all.rows; pendingCount = all.rows.length; }
      const nd = pend.rows[0]?.next_deadline ? new Date(pend.rows[0].next_deadline) : null;
      let remainingText = '';
      if (nd && !Number.isNaN(nd.getTime())) {
        const mins = Math.max(0, Math.floor((nd.getTime() - Date.now()) / 60000));
        remainingText = `، مع العلم بأن أقرب رخصة تنتهي بعد ${Math.floor(mins / 1440)} يوم ${Math.floor((mins % 1440) / 60)} ساعة ${mins % 60} دقيقة`;
      }
      subject = `تذكير بإغلاق التراخيص | ${department}`;
      topText = `نود تذكيركم بوجود عدد (${pendingCount}) رخصة بانتظار إجراءات الإغلاق${remainingText}.`;
      bottomText = 'نأمل منكم الاطلاع واتخاذ اللازم.';
      body = `${topText}\n${bottomText}`;
    }

    const xlsx = buildXlsx(department, COLUMNS.map(([h]) => h), attachRows.map((r) => COLUMNS.map(([, f]) => cellText(f(r)))));
    const safeName = department.replace(/[\\/:*?"<>|]/g, ' ').trim() || 'التراخيص';

    let emailSent = 0;
    try {
      const r = await sendEmail(recipients, subject, body, {
        topText,
        details: [
          { label: 'الإدارة', value: department },
          { label: reminder ? 'عدد الرخص بانتظار الإغلاق' : 'عدد الرخص المحالة', value: String(reminder ? pendingCount : rows.length) },
          ...(!reminder && remaining > 0 ? [{ label: 'الرخص التي لاتزال تحت الإجراء', value: String(remaining) }] : []),
          { label: 'المرفق', value: reminder ? `${safeName}.xlsx — الرخص بانتظار الإغلاق` : `${safeName}.xlsx — نسخة من الرخص المحالة` }
        ],
        bottomText,
        attachments: [{ filename: `${safeName}.xlsx`, content: xlsx.toString('base64') }]
      });
      emailSent = r.sent;
    } catch (e) {
      console.error('Developed referral e-mail failed', department, e);
    }
    sent += emailSent;
    recipientsCount += uniqueEmails(recipients).length;

    try {
      platform += await savePlatformNotifications(recipients, {
        type: reminder ? 'license_referral_reminder' : 'license_referral',
        title: subject,
        body,
        actionPage: 'licenseClosure',
        meta: { department, referredCount: rows.length, remainingCount: remaining, pendingCount, reminder, version: 'developed' }
      });
    } catch (e) {
      console.error('Developed referral platform notification failed', department, e);
    }

    details.push({ department, referred: rows.length, remaining, recipients: uniqueEmails(recipients).length, sent: emailSent });
  }
  return { ok: true, departments: details, recipients: recipientsCount, sent, platform };
}
