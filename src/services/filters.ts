export interface LicenseFilters{q?:string;dependency?:string;department?:string;status?:string;completion?:string;version?:string;contractor?:string;supervisor?:string;road?:string;dateFrom?:string;dateTo?:string}
export function buildWhere(filters:LicenseFilters,start=1){const clauses:string[]=[];const values:unknown[]=[];const add=(sql:string,value:unknown)=>{values.push(value);clauses.push(sql.replace('?',`$${start+values.length-1}`))};
  if(filters.q)add(`(license_number ILIKE '%'||?||'%' OR closure_number ILIKE '%'||?||'%' OR contractor ILIKE '%'||?||'%' OR project_name ILIKE '%'||?||'%' OR road_name ILIKE '%'||?||'%')`,filters.q);
  // q has five placeholders and must be expanded separately.
  if(filters.q){values.splice(values.length-1,1);clauses.pop();const q=`%${filters.q}%`;const base=start+values.length;values.push(q,q,q,q,q);clauses.push(`(license_number ILIKE $${base} OR closure_number ILIKE $${base+1} OR contractor ILIKE $${base+2} OR project_name ILIKE $${base+3} OR road_name ILIKE $${base+4})`)}
  const exact:[keyof LicenseFilters,string][]=[['dependency','dependency'],['department','department'],['status','analysis_status'],['version','license_version'],['contractor','contractor'],['supervisor','supervising_entity'],['road','road_name']];
  for(const [key,column] of exact)if(filters[key])add(`${column}=?`,filters[key]);
  if(filters.completion==='منجز')add(`analysis_status=ANY(?)`,['مقبول','مرفوض','تحت معالجة جهة أخرى','تحت معالجة جهة اخرى','تحت معالجة الاستشاري']);
  if(filters.completion==='غير منجز')add(`analysis_status=ANY(?)`,['مقبول تلقائيًا','مقبول تلقائياً','مقبول تلقائيا','تحت الإجراء','تحت الاجراء']);
  if(filters.dateFrom)add(`COALESCE(issued_at,created_at)>=?::timestamptz`,filters.dateFrom);
  if(filters.dateTo)add(`COALESCE(issued_at,created_at)<?::date + interval '1 day'`,filters.dateTo);
  return{sql:clauses.length?' WHERE '+clauses.join(' AND '):'',values};
}
export const filterKeys=['q','dependency','department','status','completion','version','contractor','supervisor','road','dateFrom','dateTo'] as const;
export function pickFilters(query:Record<string,unknown>):LicenseFilters{return Object.fromEntries(filterKeys.map(k=>[k,typeof query[k]==='string'?query[k]:undefined]).filter(([,v])=>v)) as LicenseFilters}
