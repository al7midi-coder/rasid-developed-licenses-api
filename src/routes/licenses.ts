import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pickFilters } from '../services/filters.js';
import { bulkLookupLicenses,bulkUpsertLicenses,closeLicense,getFacets,getSummary,listClosures,listLicenses,referLicense,updateLicenseClassification } from '../services/license-service.js';
import { getMapFeatures } from '../services/map-service.js';

const paging=z.object({page:z.coerce.number().int().min(1).default(1),pageSize:z.coerce.number().int().min(1).max(200).default(25),cursor:z.coerce.number().int().positive().optional()});
const actor=z.object({name:z.string().min(2).max(150),email:z.string().email().optional()});
export async function licenseRoutes(app:FastifyInstance){
 app.get('/summary',async request=>getSummary(pickFilters(request.query as Record<string,unknown>)));
 app.get('/facets',async request=>getFacets(pickFilters(request.query as Record<string,unknown>)));
 app.get('/',async request=>{const query=request.query as Record<string,unknown>,p=paging.parse(query);return listLicenses(pickFilters(query),p.page,p.pageSize,p.cursor)});
 app.get('/closures',async request=>{const query=request.query as Record<string,unknown>,p=paging.parse(query);return listClosures(pickFilters(query),p.page,p.pageSize,p.cursor)});
 app.get('/map',async request=>{const query=request.query as Record<string,unknown>;const box=String(query.bbox||'').split(',').map(Number);if(box.length!==4||box.some(x=>!Number.isFinite(x)))throw Object.assign(Error('bbox غير صالح'),{statusCode:400});const zoom=Math.max(1,Math.min(22,Number(query.zoom)||10));return getMapFeatures(pickFilters(query),box as [number,number,number,number],zoom)});
 app.post('/bulk-lookup',async request=>{const body=z.object({licenseNumbers:z.array(z.string().min(1)).max(5000)}).parse(request.body);return bulkLookupLicenses(body.licenseNumbers)});
 app.post('/bulk-upsert',async request=>{const body=z.object({rows:z.array(z.object({licenseNumber:z.string().min(1),closureNumber:z.string().optional(),licenseType:z.string().optional(),issuedAt:z.string().nullable().optional(),expiresAt:z.string().nullable().optional(),contractor:z.string().optional(),consultant:z.string().optional(),projectName:z.string().optional(),roadName:z.string().optional(),district:z.string().optional(),municipality:z.string().optional(),ownerEntity:z.string().optional(),supervisingEntity:z.string().optional(),dependency:z.enum(['تابع','غير تابع']).optional(),department:z.string().optional(),analysisStatus:z.string().optional(),licenseVersion:z.string().optional(),latitude:z.number().nullable().optional(),longitude:z.number().nullable().optional(),rawData:z.record(z.unknown()).optional()})).min(1).max(5000),actor,sourceFile:z.string().max(500).optional()}).parse(request.body);return bulkUpsertLicenses(body.rows,body.actor,body.sourceFile||'')});
 app.patch('/:id/classification',async request=>{const id=z.coerce.number().int().positive().parse((request.params as {id:string}).id);const body=actor.extend({dependency:z.enum(['تابع','غير تابع']),department:z.string().max(200).optional()}).parse(request.body);return updateLicenseClassification(id,{dependency:body.dependency,department:body.department},body)});
 app.post('/:id/refer',async request=>{const id=z.coerce.number().int().positive().parse((request.params as {id:string}).id);return referLicense(id,actor.parse(request.body))});
 app.post('/:id/decision',async request=>{const id=z.coerce.number().int().positive().parse((request.params as {id:string}).id);const body=actor.extend({decision:z.string(),reason:z.string().max(3000).default('')}).parse(request.body);return closeLicense(id,body.decision,body.reason,body)});
}
