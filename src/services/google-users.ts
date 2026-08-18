import { createSign, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

type SheetUser = {
  email: string;
  active: boolean;
  rowNumber: number;
  passwordColumn: number;
};

export type AuthenticatedUser = {
  email: string;
  username: string;
  name: string;
  role: string;
  jobTitle: string;
  active: boolean;
  profileImage: string;
  projectId: string;
  projectIds: string[];
  canCreateVisits: boolean;
  canEditVisits: boolean;
  canDeleteVisits: boolean;
  canReopenVisits: boolean;
  allowedPages?: string[];
  licenseDepartments?: string[];
};

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const tokenCache: { value?: string; expiresAt?: number } = {};

function b64url(value: string | Buffer){
  return Buffer.from(value).toString('base64url');
}

function serviceAccount(): ServiceAccount {
  const raw=config.GOOGLE_SERVICE_ACCOUNT_JSON;
  if(!raw) throw Object.assign(new Error('GOOGLE_SERVICE_ACCOUNT_JSON غير مضبوط'),{statusCode:503});
  let parsed: ServiceAccount;
  try { parsed=JSON.parse(raw) as ServiceAccount; }
  catch { throw Object.assign(new Error('GOOGLE_SERVICE_ACCOUNT_JSON غير صالح'),{statusCode:503}); }
  if(!parsed.client_email||!parsed.private_key) throw Object.assign(new Error('بيانات حساب خدمة Google غير مكتملة'),{statusCode:503});
  parsed.private_key=parsed.private_key.replace(/\\n/g,'\n');
  return parsed;
}

async function accessToken(){
  const now=Math.floor(Date.now()/1000);
  if(tokenCache.value && (tokenCache.expiresAt||0)>now+60) return tokenCache.value;
  const sa=serviceAccount();
  const header=b64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const payload=b64url(JSON.stringify({
    iss:sa.client_email,
    scope:'https://www.googleapis.com/auth/spreadsheets',
    aud:sa.token_uri||'https://oauth2.googleapis.com/token',
    exp:now+3600,
    iat:now
  }));
  const unsigned=`${header}.${payload}`;
  const signer=createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion=`${unsigned}.${signer.sign(sa.private_key).toString('base64url')}`;
  const body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion});
  const response=await fetch(sa.token_uri||'https://oauth2.googleapis.com/token',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body
  });
  const json=await response.json() as {access_token?:string,expires_in?:number,error_description?:string};
  if(!response.ok||!json.access_token) throw Object.assign(new Error(json.error_description||'تعذر الحصول على صلاحية Google Sheets'),{statusCode:503});
  tokenCache.value=json.access_token;
  tokenCache.expiresAt=now+Number(json.expires_in||3600);
  return json.access_token;
}

const normalize=(v:unknown)=>String(v??'').trim().toLowerCase();
const normalizedHeader=(v:unknown)=>normalize(v).replace(/[\s_\-]+/g,'');
const activeValue=(v:unknown)=>!['false','0','no','غيرنشط','inactive'].includes(normalize(v).replace(/\s+/g,''));
const csv=(v:unknown)=>String(v??'').split(',').map(x=>x.trim()).filter(Boolean);

function colToA1(index:number){
  let n=index+1,out='';
  while(n>0){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26)}
  return out;
}

async function sheetValues(){
  if(!config.PROGRAM_SPREADSHEET_ID) throw Object.assign(new Error('PROGRAM_SPREADSHEET_ID غير مضبوط'),{statusCode:503});
  const sheet=config.USERS_SHEET_NAME||'Users';
  const range=encodeURIComponent(`'${sheet.replace(/'/g,"''")}'!A:AZ`);
  const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.PROGRAM_SPREADSHEET_ID)}/values/${range}`,{
    headers:{Authorization:`Bearer ${await accessToken()}`}
  });
  const json=await response.json() as {values?:unknown[][],error?:{message?:string}};
  if(!response.ok) throw Object.assign(new Error(json.error?.message||'تعذر قراءة مستخدمي راصد'),{statusCode:503});
  return Array.isArray(json.values)?json.values:[];
}

function findColumn(headers:string[],aliases:string[]){
  return headers.findIndex(h=>aliases.includes(h));
}

function findColumnWithRaw(rawHeaders:string[],normalizedHeaders:string[],aliases:string[]){
  for(const alias of aliases){
    const exact=rawHeaders.findIndex(h=>h===alias);
    if(exact>=0)return exact;
  }
  const normalizedAliases=aliases.map(normalizedHeader);
  return normalizedHeaders.findIndex(h=>normalizedAliases.includes(h));
}

function safePasswordMatch(actual:unknown,expected:string){
  const a=Buffer.from(String(actual??''),'utf8');
  const b=Buffer.from(expected,'utf8');
  return a.length===b.length && timingSafeEqual(a,b);
}

export async function authenticateUser(loginId:string,password:string):Promise<AuthenticatedUser|null>{
  const rows=await sheetValues();
  if(!rows.length)return null;
  const rawHeaders=(rows[0]||[]).map(v=>String(v??'').trim());
  const headers=rawHeaders.map(normalizedHeader);
  const column=(...aliases:string[])=>findColumnWithRaw(rawHeaders,headers,aliases);
  const emailColumn=column('UserEmail','Email','البريد الإلكتروني','البريد الالكتروني');
  const usernameColumn=column('Username','UserLogin','Login','اسم المستخدم');
  const passwordColumn=column('Password','كلمة المرور');
  const activeColumn=column('IsActive','Active','الحالة','نشط');
  if(emailColumn<0||passwordColumn<0) throw Object.assign(new Error('أعمدة UserEmail/Password غير موجودة في Users'),{statusCode:503});

  const wanted=normalize(loginId);
  for(let i=1;i<rows.length;i++){
    const row=rows[i]||[];
    const email=normalize(row[emailColumn]);
    const username=usernameColumn>=0?normalize(row[usernameColumn]):normalize(email.split('@')[0]);
    if(email!==wanted&&username!==wanted)continue;
    const active=activeColumn<0?true:activeValue(row[activeColumn]);
    if(!active || !safePasswordMatch(row[passwordColumn],password)) return null;

    const value=(...aliases:string[])=>{
      const col=column(...aliases);
      return col>=0?row[col]:'';
    };
    const pagesRaw=String(value('ScreenPermissions','AllowedPages','الصلاحيات')??'').trim();
    const departmentsRaw=String(value('LicenseDepartments','Departments','إدارات إغلاق التراخيص')??'').trim();
    return {
      email,
      username: String(value('Username','UserLogin','Login','اسم المستخدم')||username).trim(),
      name: String(value('UserName','UserFullName','Name','الاسم','اسم كامل')||email).trim(),
      role: String(value('Role','الدور')||'Viewer').trim(),
      jobTitle: String(value('JobTitle','المسمى الوظيفي','الصفة')||'مراقب').trim(),
      active,
      profileImage: String(value('ProfileImage','الصورة')||'').trim(),
      projectId: String(value('ProjectID','المشروع')||'').trim(),
      projectIds: csv(value('ProjectIDs','المشاريع')||value('ProjectID','المشروع')),
      canCreateVisits: value('CanCreateVisits')===''?true:activeValue(value('CanCreateVisits')),
      canEditVisits: activeValue(value('CanEditVisits')),
      canDeleteVisits: activeValue(value('CanDeleteVisits')),
      canReopenVisits: activeValue(value('CanReopenVisits')),
      allowedPages: pagesRaw==='__NONE__'?[]:(pagesRaw?csv(pagesRaw):undefined),
      licenseDepartments: departmentsRaw?csv(departmentsRaw):undefined
    };
  }
  return null;
}

export async function listActiveUsers():Promise<AuthenticatedUser[]>{
  const rows=await sheetValues();
  if(!rows.length)return [];
  const rawHeaders=(rows[0]||[]).map(v=>String(v??'').trim());
  const headers=rawHeaders.map(normalizedHeader);
  const column=(...aliases:string[])=>findColumnWithRaw(rawHeaders,headers,aliases);
  const emailColumn=column('UserEmail','Email','البريد الإلكتروني','البريد الالكتروني');
  const activeColumn=column('IsActive','Active','الحالة','نشط');
  if(emailColumn<0)return [];
  const out:AuthenticatedUser[]=[];
  for(let i=1;i<rows.length;i++){
    const row=rows[i]||[];
    const email=normalize(row[emailColumn]);
    if(!email)continue;
    const active=activeColumn<0?true:activeValue(row[activeColumn]);
    if(!active)continue;
    const value=(...aliases:string[])=>{const col=column(...aliases);return col>=0?row[col]:''};
    const pagesRaw=String(value('ScreenPermissions','AllowedPages','الصلاحيات')??'').trim();
    const departmentsRaw=String(value('LicenseDepartments','Departments','إدارات إغلاق التراخيص')??'').trim();
    out.push({
      email, username:String(value('Username','UserLogin','Login','اسم المستخدم')||email.split('@')[0]).trim(),
      name:String(value('UserName','UserFullName','Name','الاسم','اسم كامل')||email).trim(),
      role:String(value('Role','الدور')||'Viewer').trim(), jobTitle:String(value('JobTitle','المسمى الوظيفي','الصفة')||'').trim(), active:true,
      profileImage:String(value('ProfileImage','الصورة')||'').trim(), projectId:String(value('ProjectID','المشروع')||'').trim(),
      projectIds:csv(value('ProjectIDs','المشاريع')||value('ProjectID','المشروع')),
      canCreateVisits:value('CanCreateVisits')===''?true:activeValue(value('CanCreateVisits')), canEditVisits:activeValue(value('CanEditVisits')), canDeleteVisits:activeValue(value('CanDeleteVisits')), canReopenVisits:activeValue(value('CanReopenVisits')),
      allowedPages:pagesRaw==='__NONE__'?[]:(pagesRaw?csv(pagesRaw):undefined), licenseDepartments:departmentsRaw?csv(departmentsRaw):undefined
    });
  }
  return out;
}

export async function findUserByEmail(email:string):Promise<SheetUser|null>{
  const rows=await sheetValues();
  if(!rows.length)return null;
  const headers=(rows[0]||[]).map(normalizedHeader);
  const emailAliases=['useremail','email','البريدالإلكتروني','البريدالالكتروني'];
  const passwordAliases=['password','كلمةالمرور'];
  const activeAliases=['isactive','active','الحالة','نشط'];
  const emailColumn=headers.findIndex(h=>emailAliases.includes(h));
  const passwordColumn=headers.findIndex(h=>passwordAliases.includes(h));
  const activeColumn=headers.findIndex(h=>activeAliases.includes(h));
  if(emailColumn<0||passwordColumn<0) throw Object.assign(new Error('أعمدة UserEmail/Password غير موجودة في Users'),{statusCode:503});
  const wanted=normalize(email);
  for(let i=1;i<rows.length;i++){
    const row=rows[i]||[];
    if(normalize(row[emailColumn])!==wanted)continue;
    const rawActive=activeColumn>=0?normalize(row[activeColumn]):'true';
    const active=!['false','0','no','غيرنشط','inactive'].includes(rawActive.replace(/\s+/g,''));
    return {email:wanted,active,rowNumber:i+1,passwordColumn};
  }
  return null;
}

export async function updateUserPassword(user:SheetUser,newPassword:string){
  if(!config.PROGRAM_SPREADSHEET_ID) throw Object.assign(new Error('PROGRAM_SPREADSHEET_ID غير مضبوط'),{statusCode:503});
  const sheet=config.USERS_SHEET_NAME||'Users';
  const cell=`'${sheet.replace(/'/g,"''")}'!${colToA1(user.passwordColumn)}${user.rowNumber}`;
  const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.PROGRAM_SPREADSHEET_ID)}/values/${encodeURIComponent(cell)}?valueInputOption=RAW`,{
    method:'PUT',
    headers:{Authorization:`Bearer ${await accessToken()}`,'Content-Type':'application/json'},
    body:JSON.stringify({range:cell,majorDimension:'ROWS',values:[[newPassword]]})
  });
  const json=await response.json() as {error?:{message?:string}};
  if(!response.ok) throw Object.assign(new Error(json.error?.message||'تعذر تحديث كلمة مرور المستخدم'),{statusCode:503});
}
