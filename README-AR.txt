Patch فوق API v34.34 الحالي.
انسخ الملفات مع المحافظة على بنية المجلد، ثم شغّل npm run build قبل commit/deploy.
يتطلب تشغيل migration: migrations/006_rasid_notifications.sql (AUTO_MIGRATE=true سيشغله وفق آلية المشروع إن كانت تلتقط ملفات migrations).
متغيرات البيئة المستخدمة:
NOTIFICATION_FROM
NOTIFICATION_LICENSE_SUBJECT
NOTIFICATION_LICENSE_BODY
NOTIFICATION_VISIT_SUBJECT
NOTIFICATION_VISIT_BODY
