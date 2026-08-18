import { createHash, randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { findUserByEmail, updateUserPassword } from './google-users.js';

const normalize=(v:unknown)=>String(v??'').trim().toLowerCase();
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
const genericMessage='إذا كان البريد مسجلًا في راصد فسيصله رابط استعادة كلمة المرور خلال دقائق.';

async function sendResetEmail(email:string,token:string){
  if(!config.RESEND_API_KEY||!config.PASSWORD_RESET_FROM) throw Object.assign(new Error('خدمة البريد غير مهيأة'),{statusCode:503});
  const base=(config.PASSWORD_RESET_URL||'https://sustaqua.com/rasid/reset-password').replace(/#.*$/,'');
  const link=`${base}#token=${encodeURIComponent(token)}`;
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${config.RESEND_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      from:config.PASSWORD_RESET_FROM,
      to:[email],
      subject:'استعادة كلمة المرور - راصد',
      html:`<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8"><h2>استعادة كلمة مرور راصد</h2><p>تم طلب إعادة تعيين كلمة المرور لحسابك في راصد.</p><p><a href="${link}">اضغط هنا لتعيين كلمة مرور جديدة</a></p><p>الرابط صالح لمدة 30 دقيقة ولمرة واحدة فقط.</p><p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p></div>`
    })
  });
  const body=await response.json().catch(()=>({})) as {message?:string,error?:{message?:string}};
  if(!response.ok) throw Object.assign(new Error(body.message||body.error?.message||'تعذر إرسال بريد الاستعادة'),{statusCode:503});
}

export async function requestPasswordReset(emailInput:string,ip?:string){
  const email=normalize(emailInput);
  if(!email||!email.includes('@'))return {ok:true,message:genericMessage};
  const user=await findUserByEmail(email);
  if(!user||!user.active)return {ok:true,message:genericMessage};
  const recent=await pool.query(
    `SELECT 1 FROM password_reset_tokens WHERE lower(email)=lower($1) AND created_at>now()-interval '60 seconds' LIMIT 1`,[email]
  );
  if(recent.rowCount)return {ok:true,message:genericMessage};
  const token=randomBytes(32).toString('base64url');
  const tokenHash=hash(token);
  await pool.query(
    `INSERT INTO password_reset_tokens(email,token_hash,expires_at,requested_ip) VALUES($1,$2,now()+interval '30 minutes',$3)`,
    [email,tokenHash,ip||null]
  );
  try{await sendResetEmail(email,token)}catch(error){
    await pool.query('DELETE FROM password_reset_tokens WHERE token_hash=$1',[tokenHash]);
    throw error;
  }
  return {ok:true,message:genericMessage};
}

export async function confirmPasswordReset(tokenInput:string,newPassword:string){
  const token=String(tokenInput||'').trim();
  if(!token)throw Object.assign(new Error('رابط الاستعادة غير صالح أو منتهي'),{statusCode:400});
  if(String(newPassword||'').length<6)throw Object.assign(new Error('كلمة المرور يجب ألا تقل عن 6 أحرف'),{statusCode:400});
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const result=await client.query(
      `SELECT id,email FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE`,
      [hash(token)]
    );
    if(!result.rowCount)throw Object.assign(new Error('رابط الاستعادة غير صالح أو منتهي'),{statusCode:400});
    const row=result.rows[0] as {id:number,email:string};
    const user=await findUserByEmail(row.email);
    if(!user||!user.active)throw Object.assign(new Error('الحساب غير متاح'),{statusCode:400});
    await updateUserPassword(user,String(newPassword));
    await client.query('UPDATE password_reset_tokens SET used_at=now() WHERE id=$1',[row.id]);
    await client.query('UPDATE password_reset_tokens SET used_at=COALESCE(used_at,now()) WHERE lower(email)=lower($1) AND id<>$2 AND used_at IS NULL',[row.email,row.id]);
    await client.query('COMMIT');
    return {ok:true,message:'تم تحديث كلمة المرور بنجاح.'};
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{client.release()}
}
