warning: in the working copy of 'src/services/license-service.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/src/services/license-service.ts b/src/services/license-service.ts[m
[1mindex b6e4fde..c22dc45 100644[m
[1m--- a/src/services/license-service.ts[m
[1m+++ b/src/services/license-service.ts[m
[36m@@ -4,7 +4,7 @@[m [mimport { buildWhere, type LicenseFilters } from './filters.js';[m
 import { cached,cacheKey,clearLicenseCache } from './query-cache.js';[m
 [m
 const completed=['مقبول','مرفوض','تحت معالجة جهة أخرى','تحت معالجة جهة اخرى','تحت معالجة الاستشاري'];[m
[31m-const notCompleted=['مقبول تلقائيًا','مقبول تلقائيا','تحت الإجراء','تحت الاجراء'];[m
[32m+[m[32mconst notCompleted=['مقبول تلقائيًا','مقبول تلقائياً','مقبول تلقائيا','تحت الإجراء','تحت الاجراء'];[m
 [m
 async function loadSummary(filters:LicenseFilters){[m
   const where=buildWhere(filters);[m
[36m@@ -72,7 +72,22 @@[m [mexport function listLicenses(filters:LicenseFilters,page:number,pageSize:number,[m
 }[m
 [m
 export function listClosures(filters:LicenseFilters,page:number,pageSize:number,cursor?:number){[m
[31m-  return listLicenses({...filters,status:'تحت الإجراء',dependency:'تابع'},page,pageSize,cursor);[m
[32m+[m[32m  return cached(cacheKey('closures',{...filters,page,pageSize,cursor}),async()=>{[m
[32m+[m[32m    const where=buildWhere({...filters,dependency:'تابع'});[m
[32m+[m[32m    const params=[...where.params,['تحت الإجراء','تحت الاجراء']];[m
[32m+[m[32m    const statusIndex=params.length;[m
[32m+[m[32m    const cursorSql=cursor?` AND id < $${params.push(cursor)}`:'';[m
[32m+[m[32m    const limitIndex=params.push(pageSize+1);[m
[32m+[m[32m    const baseWhere=`${where.sql}${where.sql?' AND':' WHERE'} analysis_status=ANY($${statusIndex})`;[m
[32m+[m[32m    const [data,totalResult]=await Promise.all([[m
[32m+[m[32m      pool.query(`SELECT id,license_number,closure_number,contractor,project_name,road_name,district,supervising_entity,dependency,department,analysis_status,license_version,latitude,longitude,reason,referred_by,referred_at,processed_by,processed_at FROM licenses${baseWhere}${cursorSql} ORDER BY id DESC LIMIT $${limitIndex}`,params),[m
[32m+[m[32m      pool.query(`SELECT COUNT(*)::bigint total FROM licenses${baseWhere}`,params.slice(0,statusIndex))[m
[32m+[m[32m    ]);[m
[32m+[m[32m    const hasMore=data.rows.length>pageSize;[m
[32m+[m[32m    const rows=hasMore?data.rows.slice(0,pageSize):data.rows;[m
[32m+[m[32m    const total=Number(totalResult.rows[0]?.total||0);[m
[32m+[m[32m    return {rows,total,page,pageSize,pages:Math.max(1,Math.ceil(total/pageSize)),nextCursor:hasMore?Number(rows.at(-1)?.id):null};[m
[32m+[m[32m  },5000);[m
 }[m
 [m
 export async function referLicense(id:number,actor:{name:string;email?:string}){[m
