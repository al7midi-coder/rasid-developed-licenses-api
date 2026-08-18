import { config } from '../config.js';
import { listActiveUsers, type AuthenticatedUser } from './google-users.js';
import { pool } from '../db/pool.js';

const logoUrl = 'https://sustaqua.com/email-assets/rasid-logo.png';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

const escapeHtml = (v: string) =>
  v.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));

const isGeneral = (u: AuthenticatedUser) =>
  ['admin', 'administrator', 'systemmanager', 'supervisor', 'owner'].includes(
    norm(u.role).replace(/\s+/g, '')
  ) || u.allowedPages?.includes('licenseClosure') === true;

const uniqueEmails = (values: string[]) => [...new Set(values.map(norm).filter(Boolean))];

async function sendEmail(
  to: string[],
  subject: string,
  body: string,
  options?: {
    topText?: string;
    details?: Array<{ label: string; value: string }>;
    bottomText?: string;
  }
) {
  const addresses = uniqueEmails(to);
  if (!addresses.length) return { sent: 0 };

  if (!config.RESEND_API_KEY) {
    throw Object.assign(new Error('RESEND_API_KEY غير مضبوط'), { statusCode: 503 });
  }

  const from =
    config.NOTIFICATION_FROM ||
    config.PASSWORD_RESET_FROM ||
    'Rasid <no-reply@sustaqua.com>';

  const contentHtml = options
    ? `
      <div style="font-family:Tahoma,Arial,sans-serif;color:#1f2937">
        ${options.topText ? `
          <div style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:2;margin-bottom:16px">
            ${escapeHtml(options.topText)}
          </div>` : ''}

        ${options.details?.length ? `
          <div style="font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:2;margin:8px 0 16px">
            ${options.details
              .filter((item) => item.value)
              .map(
                (item) =>
                  `<div><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</div>`
              )
              .join('')}
          </div>` : ''}

        ${options.bottomText ? `
          <div style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:2;margin-top:16px">
            ${escapeHtml(options.bottomText)}
          </div>` : ''}
      </div>
    `
    : `
      <div style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:2;white-space:pre-wrap">
        ${escapeHtml(body)}
      </div>
    `;

  const html = `
    <div dir="rtl"
         style="font-family:Tahoma,Arial,sans-serif;color:#1f2937;max-width:640px;margin:auto">
      ${contentHtml}

      <div style="margin-top:28px;border-top:1px solid #e5e7eb;padding-top:18px;text-align:center">
        <img
          src="${logoUrl}"
          alt="راصد"
          width="130"
          style="display:block;width:130px;max-width:130px;height:auto;margin:0 auto;opacity:.95"
        >
      </div>
    </div>
  `;

  let sent = 0;

  for (const address of addresses) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [address],
        subject,
        html
      })
    });

    if (r.ok) {
      sent++;
    } else {
      console.error('Notification email failed', address, await r.text());
    }
  }

  return { sent };
}

async function savePlatformNotifications(
  recipients: string[],
  input: {
    type: string;
    title: string;
    body: string;
    actionPage?: string;
    actionRef?: string;
    meta?: Record<string, unknown>;
  }
) {
  const addresses = uniqueEmails(recipients);
  if (!addresses.length) return 0;

  const values: unknown[] = [];

  const rows = addresses.map((email, index) => {
    const base = index * 7;

    values.push(
      email,
      input.type,
      input.title,
      input.body,
      input.actionPage || null,
      input.actionRef || null,
      JSON.stringify(input.meta || {})
    );

    return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7}::jsonb)`;
  });

  await pool.query(
    `INSERT INTO rasid_notifications(
      recipient_email,
      notification_type,
      title,
      body,
      action_page,
      action_ref,
      meta
    ) VALUES ${rows.join(',')}`,
    values
  );

  return addresses.length;
}

export async function notifyLicenseReferral(ids: number[], actorEmail = '') {
  const uniqueIds = [...new Set(ids)];

  const q = await pool.query(
    'SELECT id, license_number, department FROM licenses WHERE id = ANY($1::bigint[])',
    [uniqueIds]
  );

  const rows = q.rows as {
    id: number;
    license_number: string;
    department: string;
  }[];

  const users = await listActiveUsers();
  const grouped = new Map<string, typeof rows>();

  for (const row of rows) {
    const department =
      String(row.department || 'الإدارة المختصة').trim() || 'الإدارة المختصة';

    const list = grouped.get(department) || [];
    list.push(row);
    grouped.set(department, list);
  }

  let sent = 0;
  let platform = 0;
  let recipientsCount = 0;
  const details: any[] = [];

  for (const [department, departmentRows] of grouped) {
    const recipients = users
      .filter((u) => norm(u.email) !== norm(actorEmail))
      .filter((u) => {
        if (isGeneral(u)) return true;

        const allowed = u.licenseDepartments || [];
        return allowed.some((a) => norm(a) === norm(department));
      })
      .map((u) => u.email);

    const remainingResult = await pool.query(
      `SELECT COUNT(*)::bigint count
       FROM licenses
       WHERE dependency = 'تابع'
         AND department = $1
         AND analysis_status IN ('تحت الإجراء','تحت الاجراء')
         AND NOT (id = ANY($2::bigint[]))`,
      [department, uniqueIds]
    );

    const remaining = Number(remainingResult.rows[0]?.count || 0);

    const subject = `${
      config.NOTIFICATION_LICENSE_SUBJECT || 'إحالة التراخيص الأسبوعي'
    } | ${department}`;

    const topText = `نفيدكم بأنه تم إحالة التراخيص الأسبوعية ضمن نطاق ${department}.`;

    const bottomText = (
      config.NOTIFICATION_LICENSE_BODY ||
      'نأمل منكم الاطلاع واتخاذ اللازم، مع العلم بأن إغلاق التراخيص مرتبط بمدة زمنية.'
    ).trim();

    const body = `${topText}
عدد الرخص المحالة: ${departmentRows.length}
${remaining > 0 ? `الرخص التي لاتزال تحت الإجراء: ${remaining}` : ''}
${bottomText}`.trim();

    const emailResult = await sendEmail(recipients, subject, body, {
      topText,
      details: [
        { label: 'الإدارة', value: department },
        { label: 'عدد الرخص المحالة', value: String(departmentRows.length) },
        ...(remaining > 0
          ? [{ label: 'الرخص التي لاتزال تحت الإجراء', value: String(remaining) }]
          : [])
      ],
      bottomText
    });

    sent += emailResult.sent;
    recipientsCount += uniqueEmails(recipients).length;

    platform += await savePlatformNotifications(recipients, {
      type: 'license_referral',
      title: subject,
      body,
      actionPage: 'licenseClosure',
      meta: {
        department,
        referredCount: departmentRows.length,
        remainingCount: remaining
      }
    });

    details.push({
      department,
      referred: departmentRows.length,
      remaining,
      recipients: uniqueEmails(recipients).length,
      sent: emailResult.sent
    });
  }

  return {
    ok: true,
    departments: details,
    recipients: recipientsCount,
    sent,
    platform
  };
}

export async function notifyVisitCreated(data: {
  projectId: string;
  projectName: string;
  visitCode: string;
  road: string;
  creator: string;
  visitDate?: string;
  evaluationScore?: string;
  createdByEmail?: string;
}) {
  const users = await listActiveUsers();

  const recipients = users
    .filter((u) => norm(u.email) !== norm(data.createdByEmail))
    .filter((u) => {
      if (isGeneral(u)) return true;

      const ids = (
        u.projectIds?.length ? u.projectIds : u.projectId ? [u.projectId] : []
      ).map(norm);

      return ids.includes(norm(data.projectId));
    })
    .map((u) => u.email);

  const projectName = data.projectName || data.projectId || 'المشروع';
  const projectDisplay = /^مشروع\s+/u.test(projectName) ? projectName : `مشروع ${projectName}`;

  const subject = `${
    config.NOTIFICATION_VISIT_SUBJECT || 'راصد | زيارة ميدانية جديدة'
  } | ${projectName}`;

  const topText = `نفيدكم بأنه تم اعتماد زيارة ميدانية ضمن ${projectDisplay}.`;

  const bottomText = (
    config.NOTIFICATION_VISIT_BODY ||
    'نأمل منكم الاطلاع على تفاصيل الزيارة ومتابعة ما يرتبط بها من ملاحظات وإجراءات.'
  ).trim();

  const evaluationText =
    data.evaluationScore !== undefined &&
    data.evaluationScore !== null &&
    String(data.evaluationScore).trim() !== ''
      ? `${String(data.evaluationScore).trim()}%`
      : '—';

  const body = `${topText}
تاريخ الزيارة: ${data.visitDate || '—'}
رقم الزيارة: ${data.visitCode}
${data.road ? `الطريق: ${data.road}` : ''}
التقييم: ${evaluationText}
${data.creator ? `منشئ الزيارة: ${data.creator}` : ''}
${bottomText}`.trim();

  const emailResult = await sendEmail(recipients, subject, body, {
    topText,
    details: [
      { label: 'تاريخ الزيارة', value: data.visitDate || '—' },
      { label: 'رقم الزيارة', value: data.visitCode || '' },
      { label: 'الطريق', value: data.road || '' },
      { label: 'التقييم', value: evaluationText },
      { label: 'منشئ الزيارة', value: data.creator || '' }
    ],
    bottomText
  });

  const platform = await savePlatformNotifications(recipients, {
    type: 'visit_created',
    title: subject,
    body,
    actionPage: 'visits',
    actionRef: data.visitCode,
    meta: {
      projectId: data.projectId,
      projectName,
      visitCode: data.visitCode,
      road: data.road,
      visitDate: data.visitDate || '',
      evaluationScore: data.evaluationScore || '',
      creator: data.creator
    }
  });

  return {
    ok: true,
    recipients: uniqueEmails(recipients).length,
    ...emailResult,
    platform
  };
}

export async function listPlatformNotifications(email: string, limit = 20) {
  const result = await pool.query(
    `SELECT
      id,
      notification_type AS type,
      title,
      body,
      action_page AS "actionPage",
      action_ref AS "actionRef",
      meta,
      created_at AS "createdAt",
      read_at AS "readAt"
     FROM rasid_notifications
     WHERE LOWER(recipient_email) = LOWER($1)
     ORDER BY created_at DESC, id DESC
     LIMIT $2`,
    [email, Math.max(1, Math.min(100, limit))]
  );

  const unread = await pool.query(
    `SELECT COUNT(*)::bigint count
     FROM rasid_notifications
     WHERE LOWER(recipient_email) = LOWER($1)
       AND read_at IS NULL`,
    [email]
  );

  return {
    ok: true,
    unread: Number(unread.rows[0]?.count || 0),
    rows: result.rows
  };
}

export async function markPlatformNotificationRead(id: number, email: string) {
  const result = await pool.query(
    `UPDATE rasid_notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1
       AND LOWER(recipient_email) = LOWER($2)
     RETURNING id, read_at`,
    [id, email]
  );

  return {
    ok: true,
    updated: Boolean(result.rowCount)
  };
}
