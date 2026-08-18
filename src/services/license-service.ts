import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { buildWhere, type LicenseFilters } from './filters.js';
import { cached,cacheKey,clearLicenseCache } from './query-cache.js';

export type Actor={name:string;email?:string};
const completed=['مقبول','مرفوض','تحت معالجة جهة أخرى','تحت معالجة جهة اخرى','تحت معالجة الاستشاري'];
const notCompleted=['مقبول تلقائيًا','مقبول تلقائياً','مقبول تلقائيا','تحت الإجراء','تحت الاجراء'];
const selectColumns=`id,license_number,closure_number,license_type,issued_at,expires_at,contractor,consultant,project_name,road_name,district,municipality,owner_entity,supervising_entity,laboratory,length_m,width_m,depth_cm,coordinates_text,dependency,department,analysis_status,license_version,latitude,longitude,reason,referred_by,referred_at,processed_by,processed_at,matched_route_name,match_method,match_distance_m,match_confidence,dependency_updated_by,dependency_updated_at,warranty_started_at,warranty_ends_at,CASE WHEN warranty_ends_at IS NULL THEN NULL ELSE GREATEST(0,CEIL(EXTRACT(EPOCH FROM (warranty_ends_at-NOW()))/86400))::int END warranty_days_remaining,raw_data,source_file,created_at,updated_at`;

async function audit(client:any,eventType:string,entityType:string,entityId:string|number,previousValue:unknown,newValue:unknown,actor:Actor){
  await client.query(`INSERT INTO rasid_admin_events(event_type,entity_type,entity_id,previous_value,new_value,actor_name,actor_email) VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7)`,[eventType,entityType,String(entityId),JSON.stringify(previousValue??null),JSON.stringify(newValue??null),actor.name,actor.email||null]);
}
async function loadSummary(filters:LicenseFilters){
  const where=buildWhere(filters),completedIndex=where.values.length+1,notCompletedIndex=where.values.length+2;
  const result=await pool.query(`SELECT
    COUNT(*)::bigint total,
    COUNT(*) FILTER(WHERE dependency='تابع')::bigint related,
    COUNT(*) FILTER(WHERE dependency='غير تابع')::bigint unrelated,
    COUNT(*) FILTER(WHERE dependency='تابع' AND analysis_status=ANY($${completedIndex}))::bigint completed,
    COUNT(*) FILTER(WHERE dependency='تابع' AND analysis_status=ANY($${notCompletedIndex}))::bigint not_completed,
    COUNT(*) FILTER(WHERE dependency='تابع' AND analysis_status IN('تحت معالجة جهة أخرى','تحت معالجة جهة اخرى'))::bigint referred_center,

    /* قاعدة v32 للتحول البلدي:
       اسم المشروع يحتوي "بلدية" أو الجهة المشرفة تحتوي "قطاع".
       كما نحافظ على أي رخصة مصنفة مسبقًا في إدارة التحول البلدي. */
    COUNT(*) FILTER(
      WHERE COALESCE(project_name,'') ILIKE '%بلدية%'
         OR COALESCE(supervising_entity,'') ILIKE '%قطاع%'
         OR COALESCE(department,'') ILIKE '%التحول البلدي%'
         OR COALESCE(department,'') ILIKE '%قطاعات التحول%'
    )::bigint municipal_sector_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%رفع جودة الطرق%'
    )::bigint quality_road_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%خدمات البنية التحتية%'
         OR COALESCE(department,'') ILIKE '%البنية التحتية%'
    )::bigint infrastructure_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%دعم بلديات%'
    )::bigint municipality_support_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%سيول%'
    )::bigint flood_network_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%الجهات الخدمية%'
         OR COALESCE(department,'') ILIKE '%جهات خدمية%'
    )::bigint service_entities_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%جسور%'
         OR COALESCE(department,'') ILIKE '%أنفاق%'
         OR COALESCE(department,'') ILIKE '%انفاق%'
    )::bigint bridges_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%نقل عام%'
    )::bigint transit_licenses,

    COUNT(*) FILTER(
      WHERE COALESCE(department,'') ILIKE '%محاور رئيس%'
         OR COALESCE(department,'') ILIKE '%طرق سريع%'
    )::bigint main_axes_licenses
  FROM licenses${where.sql}`,[...where.values,completed,notCompleted]);

  const row=result.rows[0]||{},related=Number(row.related||0),done=Number(row.completed||0);
  return {
    total:Number(row.total||0),
    related,
    unrelated:Number(row.unrelated||0),
    completed:done,
    notCompleted:Number(row.not_completed||0),
    referredCenter:Number(row.referred_center||0),
    completionRate:related?Math.round(done/related*10000)/100:0,
    formula:'الرخص التابعة المنجزة ÷ إجمالي الرخص التابعة × 100',

    // الحقول التي تقرؤها بطاقات تحليل التراخيص في الواجهة.
    municipalSectorLicenses:Number(row.municipal_sector_licenses||0),
    qualityRoadLicenses:Number(row.quality_road_licenses||0),
    infrastructureLicenses:Number(row.infrastructure_licenses||0),
    municipalitySupportLicenses:Number(row.municipality_support_licenses||0),
    floodNetworkLicenses:Number(row.flood_network_licenses||0),
    serviceEntitiesLicenses:Number(row.service_entities_licenses||0),
    bridgesLicenses:Number(row.bridges_licenses||0),
    transitLicenses:Number(row.transit_licenses||0),
    mainAxesLicenses:Number(row.main_axes_licenses||0)
  };
}
export function getSummary(filters:LicenseFilters){return cached(cacheKey('summary',filters),()=>loadSummary(filters))}
async function loadFacets(filters:LicenseFilters){
  const where=buildWhere(filters),limitIndex=where.values.length+1;
  const result=await pool.query(`WITH facet_counts AS (SELECT CASE WHEN GROUPING(analysis_status)=0 THEN 'analysis_status' WHEN GROUPING(department)=0 THEN 'department' WHEN GROUPING(contractor)=0 THEN 'contractor' WHEN GROUPING(supervising_entity)=0 THEN 'supervising_entity' WHEN GROUPING(road_name)=0 THEN 'road_name' WHEN GROUPING(license_version)=0 THEN 'license_version' ELSE 'dependency' END dimension,COALESCE(CASE WHEN GROUPING(analysis_status)=0 THEN analysis_status WHEN GROUPING(department)=0 THEN department WHEN GROUPING(contractor)=0 THEN contractor WHEN GROUPING(supervising_entity)=0 THEN supervising_entity WHEN GROUPING(road_name)=0 THEN road_name WHEN GROUPING(license_version)=0 THEN license_version ELSE dependency END,'غير مسجل') name,COUNT(*)::bigint value FROM licenses${where.sql} GROUP BY GROUPING SETS ((analysis_status),(department),(contractor),(supervising_entity),(road_name),(license_version),(dependency))),ranked AS (SELECT dimension,name,value,ROW_NUMBER() OVER(PARTITION BY dimension ORDER BY value DESC,name) rank FROM facet_counts) SELECT dimension,name,value FROM ranked WHERE rank<=$${limitIndex} ORDER BY dimension,rank`,[...where.values,config.FACET_LIMIT]);
  const output:Record<string,{name:string;value:number}[]>={};for(const row of result.rows)(output[row.dimension]??=[]).push({name:row.name,value:Number(row.value)});return output;
}
export function getFacets(filters:LicenseFilters){return cached(cacheKey('facets',filters),()=>loadFacets(filters))}
async function loadLicenses(filters:LicenseFilters,page:number,pageSize:number,cursor?:number){
  const where=buildWhere(filters),cursorSql=cursor?`${where.sql?' AND':' WHERE'} id<$${where.values.length+1}`:'',dataParams=[...where.values,...(cursor?[cursor]:[]),pageSize+1];
  const [result,summary]=await Promise.all([pool.query(`SELECT ${selectColumns} FROM licenses${where.sql}${cursorSql} ORDER BY id DESC LIMIT $${dataParams.length}`,dataParams),getSummary(filters)]);
  const hasMore=result.rows.length>pageSize,rows=hasMore?result.rows.slice(0,pageSize):result.rows,total=summary.total;return{rows,total,page,pageSize,pages:Math.max(1,Math.ceil(total/pageSize)),nextCursor:hasMore?Number(rows.at(-1)?.id):null};
}
export function listLicenses(filters:LicenseFilters,page:number,pageSize:number,cursor?:number){return cached(cacheKey('list',{...filters,page,pageSize,cursor}),()=>loadLicenses(filters,page,pageSize,cursor),10000)}
export function listClosures(filters:LicenseFilters,page:number,pageSize:number,cursor?:number){return cached(cacheKey('closures',{...filters,page,pageSize,cursor}),async()=>{const where=buildWhere({...filters,dependency:'تابع'}),params=[...where.values,['تحت الإجراء','تحت الاجراء']] as unknown[];const statusIndex=params.length,cursorSql=cursor?` AND id < $${params.push(cursor)}`:'',limitIndex=params.push(pageSize+1),baseWhere=`${where.sql}${where.sql?' AND':' WHERE'} analysis_status=ANY($${statusIndex})`;const [data,totalResult]=await Promise.all([pool.query(`SELECT ${selectColumns} FROM licenses${baseWhere}${cursorSql} ORDER BY id DESC LIMIT $${limitIndex}`,params),pool.query(`SELECT COUNT(*)::bigint total FROM licenses${baseWhere}`,params.slice(0,statusIndex))]);const hasMore=data.rows.length>pageSize,rows=hasMore?data.rows.slice(0,pageSize):data.rows,total=Number(totalResult.rows[0]?.total||0);return{rows,total,page,pageSize,pages:Math.max(1,Math.ceil(total/pageSize)),nextCursor:hasMore?Number(rows.at(-1)?.id):null}},5000)}
export async function bulkLookupLicenses(numbers:string[]){if(!numbers.length)return{rows:[]};const result=await pool.query(`SELECT ${selectColumns} FROM licenses WHERE license_number=ANY($1::text[]) OR closure_number=ANY($1::text[])`,[numbers]);return{rows:result.rows}}
export async function getLicenseDetails(id:number){const [license,events]=await Promise.all([pool.query(`SELECT ${selectColumns} FROM licenses WHERE id=$1`,[id]),pool.query(`SELECT id,event_type,previous_status,new_status,reason,actor_name,actor_email,created_at FROM license_closure_events WHERE license_id=$1 ORDER BY created_at DESC,id DESC`,[id])]);if(!license.rowCount)throw Object.assign(Error('الرخصة غير موجودة'),{statusCode:404});return{license:license.rows[0],events:events.rows}}
export async function referLicense(id:number,actor:Actor){const client=await pool.connect();try{await client.query('BEGIN');const current=await client.query(`SELECT ${selectColumns} FROM licenses WHERE id=$1 FOR UPDATE`,[id]);if(!current.rowCount)throw Object.assign(Error('الرخصة غير موجودة'),{statusCode:404});await client.query(`UPDATE licenses SET dependency='تابع',analysis_status='تحت الإجراء',referred_by=$2,referred_at=NOW(),updated_at=NOW() WHERE id=$1`,[id,actor.name]);await client.query(`INSERT INTO license_closure_events(license_id,event_type,previous_status,new_status,actor_name,actor_email) VALUES($1,'referral',$2,'تحت الإجراء',$3,$4)`,[id,current.rows[0].analysis_status,actor.name,actor.email||null]);await client.query('COMMIT');clearLicenseCache();return{ok:true,id,status:'تحت الإجراء',referredBy:actor.name,referredAt:new Date().toISOString()}}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
export async function bulkReferLicenses(ids:number[],actor:Actor){const results=[];for(const id of ids)results.push(await referLicense(id,actor));return{ok:true,total:results.length,rows:results}}
export async function updateLicenseClassification(id:number,input:{dependency:'تابع'|'غير تابع';department?:string},actor:Actor){
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    // نقرأ فقط الحقول الأساسية الموجودة في مخطط licenses الأصلي لتفادي تعطل الحفظ بسبب أعمدة إضافية غير متزامنة بين البيئات.
    const current=await client.query(`SELECT id,license_number,dependency,department,analysis_status,reason,processed_by,processed_at,raw_data,updated_at FROM licenses WHERE id=$1 FOR UPDATE`,[id]);
    if(!current.rowCount)throw Object.assign(Error('الرخصة غير موجودة'),{statusCode:404});
    const prev=current.rows[0],dependency=input.dependency,department=dependency==='تابع'?String(input.department||'').trim():'غير مطابقة';
    if(dependency==='تابع'&&!department)throw Object.assign(Error('يجب تحديد الإدارة عند تحويل الرخصة إلى تابع'),{statusCode:400});
    const reopening=dependency==='تابع'&&(prev.dependency!=='تابع'||String(prev.department||'')!==department);
    const result=await client.query(`UPDATE licenses SET
      dependency=$2,
      department=$3,
      analysis_status=CASE WHEN $4 THEN 'تحت الإجراء' ELSE analysis_status END,
      reason=CASE WHEN $4 THEN NULL ELSE reason END,
      processed_by=CASE WHEN $4 THEN NULL ELSE processed_by END,
      processed_at=CASE WHEN $4 THEN NULL ELSE processed_at END,
      raw_data=COALESCE(raw_data,'{}'::jsonb)||jsonb_build_object('manualClassification',jsonb_build_object('dependency',$2::text,'department',$3::text,'updatedBy',$5::text,'updatedAt',NOW())),
      updated_at=NOW()
      WHERE id=$1
      RETURNING id,license_number,dependency,department,analysis_status,reason,processed_by,processed_at,updated_at`,[id,dependency,department,reopening,actor.name]);

    // السجلات الإدارية مساعدة فقط؛ فشلها لا يلغي تعديل التبعية الأساسي.
    await client.query('SAVEPOINT manual_classification_logs');
    try{
      await audit(client,'manual_classification','license',id,{dependency:prev.dependency,department:prev.department,analysisStatus:prev.analysis_status},{dependency,department,analysisStatus:result.rows[0].analysis_status},actor);
      await client.query(`INSERT INTO license_closure_events(license_id,event_type,previous_status,new_status,reason,actor_name,actor_email) VALUES($1,'manual_classification',$2,$3,$4,$5,$6)`,[id,prev.analysis_status,result.rows[0].analysis_status,`تعديل التبعية إلى ${dependency}${dependency==='تابع'?' / '+department:''}`,actor.name,actor.email||null]);
      await client.query('RELEASE SAVEPOINT manual_classification_logs');
    }catch(logError){
      await client.query('ROLLBACK TO SAVEPOINT manual_classification_logs');
      await client.query('RELEASE SAVEPOINT manual_classification_logs');
      console.warn('manual_classification_log_failed',logError);
    }
    await client.query('COMMIT');
    clearLicenseCache();
    return{ok:true,row:result.rows[0],reopened:reopening};
  }catch(error){
    try{await client.query('ROLLBACK')}catch{}
    throw error;
  }finally{client.release()}
}

export async function closeLicense(id:number,decision:string,reason:string,actor:Actor){const allowed=['مقبول','مرفوض','مقبول تلقائيًا','تحت معالجة جهة أخرى'];if(!allowed.includes(decision))throw Object.assign(Error('قرار الإغلاق غير معتمد'),{statusCode:400});const client=await pool.connect();try{await client.query('BEGIN');const current=await client.query('SELECT analysis_status FROM licenses WHERE id=$1 FOR UPDATE',[id]);if(!current.rowCount)throw Object.assign(Error('الرخصة غير موجودة'),{statusCode:404});const accepted=decision==='مقبول';await client.query(`UPDATE licenses SET analysis_status=$2,reason=$3,processed_by=$4,processed_at=NOW(),warranty_started_at=CASE WHEN $5 THEN NOW() ELSE warranty_started_at END,warranty_ends_at=CASE WHEN $5 THEN NOW()+INTERVAL '2 years' ELSE warranty_ends_at END,updated_at=NOW() WHERE id=$1`,[id,decision,reason,actor.name,accepted]);await client.query(`INSERT INTO license_closure_events(license_id,event_type,previous_status,new_status,reason,actor_name,actor_email) VALUES($1,'decision',$2,$3,$4,$5,$6)`,[id,current.rows[0].analysis_status,decision,reason,actor.name,actor.email||null]);await client.query('COMMIT');clearLicenseCache();return{ok:true,id,status:decision,processedBy:actor.name,warrantyYears:accepted?2:null}}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
export async function setDependency(id:number,input:{dependency:'تابع'|'غير تابع';department?:string;routeName?:string;method?:string;distanceM?:number|null;confidence?:number|null;reason?:string},actor:Actor){const client=await pool.connect();try{await client.query('BEGIN');const current=await client.query(`SELECT ${selectColumns} FROM licenses WHERE id=$1 FOR UPDATE`,[id]);if(!current.rowCount)throw Object.assign(Error('الرخصة غير موجودة'),{statusCode:404});const department=input.dependency==='تابع'?(input.department||current.rows[0].department||'غير محدد'):(input.department||'غير مطابقة');await client.query(`UPDATE licenses SET dependency=$2,department=$3,matched_route_name=$4,match_method=$5,match_distance_m=$6,match_confidence=$7,reason=COALESCE(NULLIF($8,''),reason),dependency_updated_by=$9,dependency_updated_at=NOW(),updated_at=NOW() WHERE id=$1`,[id,input.dependency,department,input.routeName||null,input.method||'إضافة يدوية',input.distanceM??null,input.confidence??null,input.reason||'',actor.name]);await client.query(`INSERT INTO license_closure_events(license_id,event_type,previous_status,new_status,reason,actor_name,actor_email) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,input.dependency==='تابع'?'dependency_add':'dependency_remove',current.rows[0].dependency,input.dependency,input.reason||input.method||'',actor.name,actor.email||null]);await audit(client,input.dependency==='تابع'?'dependency_add':'dependency_remove','license',id,current.rows[0],input,actor);await client.query('COMMIT');clearLicenseCache();return{ok:true,id,dependency:input.dependency,department,routeName:input.routeName||null}}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}

export type BulkLicenseInput={licenseNumber:string;closureNumber?:string;licenseType?:string;issuedAt?:string|null;expiresAt?:string|null;contractor?:string;consultant?:string;projectName?:string;roadName?:string;district?:string;municipality?:string;ownerEntity?:string;supervisingEntity?:string;laboratory?:string;lengthM?:number|null;widthM?:number|null;depthCm?:number|null;coordinatesText?:string;dependency?:'تابع'|'غير تابع';department?:string;analysisStatus?:string;licenseVersion?:string;latitude?:number|null;longitude?:number|null;matchedRouteName?:string;matchMethod?:string;matchDistanceM?:number|null;matchConfidence?:number|null;reason?:string;rawData?:Record<string,unknown>};
export async function bulkUpsertLicenses(rows:BulkLicenseInput[],actor:Actor,sourceFile=''){
  const client=await pool.connect();
  let inserted=0,updated=0,preservedExisting=0,existingPending=0,processedPreviously=0;
  const returned:any[]=[];
  try{
    await client.query('BEGIN');
    for(const row of rows){
      const existed=await client.query(`SELECT id,dependency,department,analysis_status,reason,matched_route_name,match_method,match_distance_m,match_confidence,processed_by,processed_at,warranty_started_at,warranty_ends_at FROM licenses WHERE license_number=$1 FOR UPDATE`,[row.licenseNumber]);
      const previous=existed.rows[0]||null;
      if(previous){
        preservedExisting++;
        const status=String(previous.analysis_status||'').trim();
        if(previous.dependency==='تابع'&&['تحت الإجراء','تحت الاجراء'].includes(status))existingPending++;
        if(completed.includes(status))processedPreviously++;
      }
      const params=[row.licenseNumber,row.closureNumber||null,row.licenseType||null,row.issuedAt||null,row.expiresAt||null,row.contractor||null,row.consultant||null,row.projectName||null,row.roadName||null,row.district||null,row.municipality||null,row.ownerEntity||null,row.supervisingEntity||null,row.laboratory||null,row.lengthM??null,row.widthM??null,row.depthCm??null,row.coordinatesText||null,row.dependency||'غير تابع',row.department||'غير مطابقة',row.analysisStatus||'تحت الإجراء',row.licenseVersion||null,row.latitude??null,row.longitude??null,row.matchedRouteName||null,row.matchMethod||null,row.matchDistanceM??null,row.matchConfidence??null,row.reason||null,JSON.stringify(row.rawData||{}),sourceFile];
      const result=await client.query(`INSERT INTO licenses(license_number,closure_number,license_type,issued_at,expires_at,contractor,consultant,project_name,road_name,district,municipality,owner_entity,supervising_entity,laboratory,length_m,width_m,depth_cm,coordinates_text,dependency,department,analysis_status,license_version,latitude,longitude,matched_route_name,match_method,match_distance_m,match_confidence,reason,raw_data,source_file,updated_at)
        VALUES(${params.map((_,i)=>`$${i+1}`).join(',')},NOW())
        ON CONFLICT(license_number) DO UPDATE SET
          closure_number=COALESCE(NULLIF(EXCLUDED.closure_number,''),licenses.closure_number),
          license_type=COALESCE(NULLIF(EXCLUDED.license_type,''),licenses.license_type),
          issued_at=COALESCE(EXCLUDED.issued_at,licenses.issued_at),
          expires_at=COALESCE(EXCLUDED.expires_at,licenses.expires_at),
          contractor=COALESCE(NULLIF(EXCLUDED.contractor,''),licenses.contractor),
          consultant=COALESCE(NULLIF(EXCLUDED.consultant,''),licenses.consultant),
          project_name=COALESCE(NULLIF(EXCLUDED.project_name,''),licenses.project_name),
          road_name=COALESCE(NULLIF(EXCLUDED.road_name,''),licenses.road_name),
          district=COALESCE(NULLIF(EXCLUDED.district,''),licenses.district),
          municipality=COALESCE(NULLIF(EXCLUDED.municipality,''),licenses.municipality),
          owner_entity=COALESCE(NULLIF(EXCLUDED.owner_entity,''),licenses.owner_entity),
          supervising_entity=COALESCE(NULLIF(EXCLUDED.supervising_entity,''),licenses.supervising_entity),
          laboratory=COALESCE(NULLIF(EXCLUDED.laboratory,''),licenses.laboratory),
          length_m=COALESCE(EXCLUDED.length_m,licenses.length_m),
          width_m=COALESCE(EXCLUDED.width_m,licenses.width_m),
          depth_cm=COALESCE(EXCLUDED.depth_cm,licenses.depth_cm),
          coordinates_text=COALESCE(NULLIF(EXCLUDED.coordinates_text,''),licenses.coordinates_text),
          dependency=licenses.dependency,
          department=licenses.department,
          analysis_status=licenses.analysis_status,
          license_version=COALESCE(NULLIF(EXCLUDED.license_version,''),licenses.license_version),
          latitude=COALESCE(EXCLUDED.latitude,licenses.latitude),
          longitude=COALESCE(EXCLUDED.longitude,licenses.longitude),
          matched_route_name=licenses.matched_route_name,
          match_method=licenses.match_method,
          match_distance_m=licenses.match_distance_m,
          match_confidence=licenses.match_confidence,
          reason=licenses.reason,
          raw_data=COALESCE(licenses.raw_data,'{}'::jsonb)||EXCLUDED.raw_data,
          source_file=COALESCE(NULLIF(EXCLUDED.source_file,''),licenses.source_file),
          updated_at=NOW()
        RETURNING id,license_number,dependency,department,analysis_status`,params);
      previous?updated++:inserted++;
      returned.push(result.rows[0]);
    }
    await audit(client,'bulk_upsert','licenses','bulk',{count:rows.length},{inserted,updated,preservedExisting,existingPending,processedPreviously,sourceFile},actor);
    await client.query('COMMIT');
    clearLicenseCache();
    return{ok:true,total:rows.length,inserted,updated,preservedExisting,existingPending,processedPreviously,actor:actor.name,rows:returned};
  }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}

export type RoadRuleInput={streetName:string;aliases?:string[];department:string;routeName?:string;matchMode:'street_route'|'street_only';sensitivityM:number;active?:boolean};
const normalizeArabic=(value:string)=>value.trim().toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ');
export async function listRoadRules(){const result=await pool.query('SELECT * FROM road_dependency_rules ORDER BY active DESC,department,street_name,id');return{rows:result.rows}}
async function previewRoadNames(names:string[]){const normalized=[...new Set(names.map(normalizeArabic).filter(Boolean))],patterns=normalized.map(x=>`%${x}%`);if(!patterns.length)return{affectedCount:0,rows:[]};const result=await pool.query(`SELECT id,license_number,closure_number,road_name,latitude,longitude,dependency,department,matched_route_name,match_method,match_distance_m,reason FROM licenses WHERE road_name IS NOT NULL AND EXISTS(SELECT 1 FROM unnest($1::text[]) pattern WHERE lower(translate(road_name,'أإآةى','اااهي')) LIKE pattern) ORDER BY id DESC LIMIT 1000`,[patterns]);return{affectedCount:result.rowCount,rows:result.rows}}
export async function previewRoadRule(input:RoadRuleInput){const impact=await previewRoadNames([input.streetName,...(input.aliases||[])]);return{rule:input,...impact}}
export async function roadRuleImpact(id:number){const rule=await pool.query('SELECT * FROM road_dependency_rules WHERE id=$1',[id]);if(!rule.rowCount)throw Object.assign(Error('قاعدة الشارع غير موجودة'),{statusCode:404});const impact=await previewRoadNames([rule.rows[0].street_name,...(rule.rows[0].aliases||[])]);return{rule:rule.rows[0],...impact}}
export async function createRoadRule(input:RoadRuleInput,actor:Actor){const result=await pool.query(`INSERT INTO road_dependency_rules(street_name,normalized_street_name,aliases,department,route_name,match_mode,sensitivity_m,active,created_by,updated_by) VALUES($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$9) RETURNING *`,[input.streetName,normalizeArabic(input.streetName),JSON.stringify(input.aliases||[]),input.department,input.routeName||null,input.matchMode,input.sensitivityM,input.active!==false,actor.name]);await audit(pool,'road_rule_create','road_rule',result.rows[0].id,null,result.rows[0],actor);return{ok:true,row:result.rows[0]}}
export async function updateRoadRule(id:number,input:Partial<RoadRuleInput>,actor:Actor){const current=await pool.query('SELECT * FROM road_dependency_rules WHERE id=$1',[id]);if(!current.rowCount)throw Object.assign(Error('قاعدة الشارع غير موجودة'),{statusCode:404});const v={...current.rows[0],...input};const result=await pool.query(`UPDATE road_dependency_rules SET street_name=$2,normalized_street_name=$3,aliases=$4::jsonb,department=$5,route_name=$6,match_mode=$7,sensitivity_m=$8,active=$9,updated_by=$10,updated_at=NOW() WHERE id=$1 RETURNING *`,[id,v.streetName??v.street_name,normalizeArabic(v.streetName??v.street_name),JSON.stringify(v.aliases||[]),v.department,v.routeName??v.route_name,v.matchMode??v.match_mode,v.sensitivityM??v.sensitivity_m,v.active,actor.name]);await audit(pool,'road_rule_update','road_rule',id,current.rows[0],result.rows[0],actor);return{ok:true,row:result.rows[0]}}
export async function deleteRoadRule(id:number,actor:Actor){const current=await pool.query('SELECT * FROM road_dependency_rules WHERE id=$1',[id]);if(!current.rowCount)throw Object.assign(Error('قاعدة الشارع غير موجودة'),{statusCode:404});const result=await pool.query('UPDATE road_dependency_rules SET active=false,updated_by=$2,updated_at=NOW() WHERE id=$1 RETURNING *',[id,actor.name]);await audit(pool,'road_rule_delete','road_rule',id,current.rows[0],result.rows[0],actor);return{ok:true,id}}
export async function listRouteLayers(){const result=await pool.query('SELECT id,name,department,layer_type,source_file,geojson,active,created_by,updated_by,created_at,updated_at FROM route_layers WHERE active=true ORDER BY department,name,id');return{rows:result.rows}}
export async function createRouteLayer(input:{name:string;department:string;layerType?:string;sourceFile?:string;geojson:unknown;replaceExisting?:boolean},actor:Actor){const client=await pool.connect();try{await client.query('BEGIN');let replacedRows:any[]=[];if(input.replaceExisting){const previous=await client.query('SELECT id,name,department,layer_type,source_file,active,created_by,updated_by,created_at,updated_at FROM route_layers WHERE department=$1 AND active=true FOR UPDATE',[input.department]);replacedRows=previous.rows;await client.query('UPDATE route_layers SET active=false,updated_by=$2,updated_at=NOW() WHERE department=$1 AND active=true',[input.department,actor.name])}const result=await client.query(`INSERT INTO route_layers(name,department,layer_type,source_file,geojson,created_by,updated_by) VALUES($1,$2,$3,$4,$5::jsonb,$6,$6) RETURNING *`,[input.name,input.department,input.layerType||'route',input.sourceFile||null,JSON.stringify(input.geojson),actor.name]);await audit(client,input.replaceExisting?'route_layer_replace':'route_layer_create','route_layer',result.rows[0].id,replacedRows.map(row=>({...row,geojson:'[stored]'})),{...result.rows[0],geojson:'[stored]'},actor);await client.query('COMMIT');return{ok:true,row:result.rows[0],replaced:replacedRows.length}}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
export async function deleteRouteLayer(id:number,actor:Actor){const current=await pool.query('SELECT id,name,department,layer_type,source_file,active FROM route_layers WHERE id=$1',[id]);if(!current.rowCount)throw Object.assign(Error('النطاق غير موجود'),{statusCode:404});const result=await pool.query('UPDATE route_layers SET active=false,updated_by=$2,updated_at=NOW() WHERE id=$1 RETURNING id,name,department,layer_type,source_file,active,updated_by,updated_at',[id,actor.name]);await audit(pool,'route_layer_delete','route_layer',id,current.rows[0],result.rows[0],actor);return{ok:true,id}}
export async function listProjectRules(){const result=await pool.query('SELECT * FROM project_classification_rules WHERE active=true ORDER BY rule_order,id');return{rows:result.rows}}
export async function replaceProjectRules(rows:any[],actor:Actor){const client=await pool.connect();try{await client.query('BEGIN');await client.query('UPDATE project_classification_rules SET active=false,updated_at=NOW()');for(const row of rows)await client.query(`INSERT INTO project_classification_rules(rule_order,department,project_name_pattern,contractor_pattern,consultant_pattern,owner_pattern,road_pattern,municipality_pattern,raw_data,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)`,[Number(row.ruleOrder||row.order||100),String(row.department||''),row.projectNamePattern||row.project||null,row.contractorPattern||row.contractor||null,row.consultantPattern||row.consultant||null,row.ownerPattern||row.owner||null,row.roadPattern||row.road||null,row.municipalityPattern||row.municipality||null,JSON.stringify(row.rawData||row),actor.name]);await audit(client,'replace_project_rules','project_rules','all',null,{count:rows.length},actor);await client.query('COMMIT');return{ok:true,total:rows.length}}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}