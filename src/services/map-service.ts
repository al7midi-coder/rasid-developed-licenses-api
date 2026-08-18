import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { buildWhere, type LicenseFilters } from './filters.js';

export async function getMapFeatures(filters:LicenseFilters,bbox:[number,number,number,number],zoom:number){
  const where=buildWhere(filters),[west,south,east,north]=bbox,envelopeIndex=where.values.length+1;
  const base=`${where.sql}${where.sql?' AND':' WHERE'} latitude BETWEEN $${envelopeIndex+1} AND $${envelopeIndex+3} AND longitude BETWEEN $${envelopeIndex} AND $${envelopeIndex+2}`;
  const params=[...where.values,west,south,east,north];
  if(zoom<14){
    const cellSize=zoom<8?0.1:zoom<11?0.02:0.005;
    params.push(cellSize,config.MAP_CLUSTER_LIMIT);
    const cellIndex=params.length-1,limitIndex=params.length;
    const result=await pool.query(`SELECT (floor(longitude/$${cellIndex})*$${cellIndex})::float8 longitude,(floor(latitude/$${cellIndex})*$${cellIndex})::float8 latitude,COUNT(*)::bigint count,MIN(department) department FROM licenses${base} GROUP BY floor(longitude/$${cellIndex}),floor(latitude/$${cellIndex}) ORDER BY count DESC LIMIT $${limitIndex}`,params);
    return {type:'clusters',truncated:result.rows.length>=config.MAP_CLUSTER_LIMIT,features:result.rows.map((x:any)=>({latitude:Number(x.latitude),longitude:Number(x.longitude),count:Number(x.count),department:x.department}))};
  }
  params.push(config.MAP_POINT_LIMIT);
  const result=await pool.query(`SELECT id,license_number,closure_number,contractor,project_name,road_name,supervising_entity,latitude::float8,longitude::float8,department,dependency,analysis_status,processed_at,CASE WHEN processed_at IS NOT NULL THEN processed_at + INTERVAL '2 years' ELSE NULL END warranty_end FROM licenses${base} ORDER BY id DESC LIMIT $${params.length}`,params);
  return {type:'points',truncated:result.rows.length>=config.MAP_POINT_LIMIT,features:result.rows.map((x:any)=>({...x,latitude:Number(x.latitude),longitude:Number(x.longitude)}))};
}
