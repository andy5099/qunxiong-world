const MANIFEST_URL=new URL('../../assets/game-art/manifest.json',import.meta.url);
let manifest=null,manifestPromise=null;const records=new Map();
const status={phase:'idle',total:0,loaded:0,failed:0,progress:0,errors:[]};

export async function loadArtManifest({fetcher=globalThis.fetch}={}){
  if(manifest)return manifest;if(manifestPromise)return manifestPromise;
  status.phase='manifest';manifestPromise=(async()=>{try{const response=await fetcher(MANIFEST_URL);if(!response.ok)throw new Error(`Art manifest HTTP ${response.status}`);const data=await response.json();if(!data||typeof data.assets!=='object')throw new Error('Invalid art manifest');manifest=data;status.phase='ready';return manifest;}catch(error){status.phase='fallback';status.errors.push(String(error?.message||error));manifest={version:0,assets:{},bundles:{}};return manifest;}})();return manifestPromise;
}

function loadOne(id,entry,ImageCtor){
  if(records.has(id))return records.get(id).promise;const src=new URL(entry.src,MANIFEST_URL);const record={id,src:src.href,entry,image:null,state:'loading',promise:null};
  record.promise=new Promise(resolve=>{if(!ImageCtor){record.state='failed';status.failed+=1;resolve(null);return;}const image=new ImageCtor();record.image=image;image.decoding='async';image.onload=()=>{record.state='loaded';status.loaded+=1;resolve(image);};image.onerror=()=>{record.state='failed';status.failed+=1;status.errors.push(`${id}: ${entry.src}`);resolve(null);};image.src=src.href;});records.set(id,record);return record.promise;
}

export async function preloadArtAssets({ids=null,bundle='region01',ImageCtor=globalThis.Image,fetcher=globalThis.fetch}={}){
  const data=await loadArtManifest({fetcher});const selected=ids||data.bundles?.[bundle]||[];const unique=[...new Set(selected)].filter(id=>data.assets[id]);status.phase='loading';status.total=unique.length;status.loaded=0;status.failed=0;status.errors=[];await Promise.all(unique.map(id=>loadOne(id,data.assets[id],ImageCtor)));status.progress=status.total?(status.loaded+status.failed)/status.total:1;status.phase=status.failed?'partial':'complete';return getArtLoadStatus();
}
export function getArtAsset(id){const record=records.get(id);return record?.state==='loaded'?record.image:null;}
export function getArtAssetDefinition(id){return manifest?.assets?.[id]||null;}
export function hasArtAsset(id){return Boolean(getArtAsset(id));}
export function getArtLoadStatus(){return {...status,errors:[...status.errors]};}
export function getArtManifest(){return manifest;}
export function applyUiArtAssets(root=globalThis.document){
  if(!root)return 0;const bindings=[['ui.battleHud','.combat-readout'],['ui.skillFrame','.skill-card'],['ui.equipmentFrame','.slot'],['ui.inventorySlot','.item-card'],['ui.bossBarFrame','.boss-button'],['ui.hpBarFrame','.meter.hp'],['ui.mpBarFrame','.meter.shield'],['ui.panelFrame','.panel'],['ui.buttonNormal','.action'],['ui.buttonPrimary','.boss-button'],['ui.dialogueFrame','.modal-card'],['ui.combatLogFrame','.event-log']];let applied=0;
  for(const [id,selector] of bindings){const image=getArtAsset(id),entry=getArtAssetDefinition(id);if(!image)continue;root.querySelectorAll(selector).forEach(node=>{node.style.setProperty('--aw-art-image',`url("${image.src}")`);node.style.setProperty('--aw-art-border',String(entry?.border||24));node.classList.add(entry?.type==='nine-slice'?'has-nine-slice-art':'has-art-image');applied+=1;});}return applied;
}
export function resetArtAssetManagerForTests(){manifest=null;manifestPromise=null;records.clear();Object.assign(status,{phase:'idle',total:0,loaded:0,failed:0,progress:0,errors:[]});}
