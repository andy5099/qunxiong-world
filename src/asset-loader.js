import { ART_MANIFEST } from './art-manifest.js?v=v032a-art-1';
const images = new Map(), pending = new Map(), status = { requested: 0, loaded: 0, failed: 0 };
export function preloadArtAsset(path) { if (!path || typeof Image === 'undefined') return Promise.resolve(null); if (images.has(path)) return Promise.resolve(images.get(path)); if (pending.has(path)) return pending.get(path); status.requested++; const promise=new Promise(resolve=>{const image=new Image();image.decoding='async';image.onload=()=>{images.set(path,image);pending.delete(path);status.loaded++;resolve(image);};image.onerror=()=>{pending.delete(path);status.failed++;resolve(null);};image.src=path;});pending.set(path,promise);return promise; }
export function preloadArtAssets(){const paths=[];for(const group of Object.values(ART_MANIFEST))if(group&&typeof group==='object')for(const entry of Object.values(group)){if(typeof entry==='string')paths.push(entry);else if(entry&&typeof entry==='object')for(const value of Object.values(entry))if(typeof value==='string'&&value.startsWith('./'))paths.push(value);}return Promise.all([...new Set(paths)].map(preloadArtAsset));}
export const getArtAsset=path=>images.get(path)||null;
export const hasArtAsset=path=>Boolean(getArtAsset(path)?.complete);
export const getArtLoadStatus=()=>({...status,pending:pending.size});
