import { config } from '../config.js';

type Entry<T>={expiresAt:number;value:Promise<T>};
const entries=new Map<string,Entry<unknown>>();
const MAX_ENTRIES=250;

export function cached<T>(key:string,loader:()=>Promise<T>,ttl=config.CACHE_TTL_MS):Promise<T>{
  const now=Date.now();
  const current=entries.get(key) as Entry<T>|undefined;
  if(current&&current.expiresAt>now)return current.value;
  const value=loader().catch(error=>{entries.delete(key);throw error});
  entries.set(key,{expiresAt:now+ttl,value});
  if(entries.size>MAX_ENTRIES){const oldest=entries.keys().next().value;if(oldest)entries.delete(oldest)}
  return value;
}

export function clearLicenseCache(){entries.clear()}
export function cacheKey(scope:string,value:unknown){
  const keys=value&&typeof value==='object'?Object.keys(value as object).sort():[];
  return `${scope}:${JSON.stringify(value,keys)}`;
}
