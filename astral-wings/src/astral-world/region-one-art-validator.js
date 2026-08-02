import { hasArtAsset } from './art-asset-manager.js';

const SPEC_URL=new URL('../../PRODUCTION_ASSET_SPEC.json',import.meta.url);
const absolute=path=>new URL(`../../${path}`,import.meta.url);

async function inspectImage(asset,{fetcher=globalThis.fetch,ImageCtor=globalThis.Image,documentRef=globalThis.document}={}){
  const response=await fetcher(absolute(asset.path));if(!response.ok){if(response.status===404)return{state:'missing',reason:'file-not-found'};return{state:'invalid',reason:`http-${response.status}`};}
  const blob=await response.blob();const url=URL.createObjectURL(blob);try{const image=await new Promise((resolve,reject)=>{const value=new ImageCtor();value.onload=()=>resolve(value);value.onerror=()=>reject(new Error('decode-failed'));value.src=url;});const width=image.naturalWidth,height=image.naturalHeight;
    if(asset.frame){const [fw,fh]=asset.frame.split('x').map(Number);if(height!==fh||width!==fw*asset.frames)return{state:'invalid',reason:`expected-${fw*asset.frames}x${fh}-got-${width}x${height}`};}
    if(asset.size){const [mw,mh]=asset.size.match(/\d+/g).map(Number);if(width<mw||height<mh)return{state:'invalid',reason:`minimum-${mw}x${mh}-got-${width}x${height}`};}
    if(asset.alpha&&documentRef){const canvas=documentRef.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,width,height).data;let transparent=false;for(let i=3;i<pixels.length;i+=Math.max(4,Math.floor(pixels.length/16000/4)*4)){if(pixels[i]<250){transparent=true;break;}}if(!transparent)return{state:'invalid',reason:'alpha-required'};}
    return{state:'ready',width,height};
  }finally{URL.revokeObjectURL(url);}
}

export async function validateRegionOneProductionAssets(options={}){
  let spec;try{const response=await (options.fetcher||globalThis.fetch)(SPEC_URL);if(!response.ok)throw new Error(`spec-http-${response.status}`);spec=await response.json();}catch(error){return{ready:[],missing:[],invalid:[{id:'PRODUCTION_ASSET_SPEC',reason:String(error.message||error)}]};}
  const output={ready:[],missing:[],invalid:[]};for(const asset of spec.assets){try{const result=await inspectImage(asset,options);output[result.state].push({id:asset.id,path:asset.path,...result});}catch(error){output.invalid.push({id:asset.id,path:asset.path,reason:String(error.message||error)});}}return output;
}

export function getRegionOneArtStatus(){
  const group=ids=>ids.every(hasArtAsset);return{backgroundReady:hasArtAsset('background.region01.battle'),heroReady:hasArtAsset('character.astralBlade.idle'),monstersReady:group(['monster.region01.starSlime','monster.region01.moonRabbit','monster.region01.starBeetle']),bossReady:hasArtAsset('boss.region01.crownedBeast'),petReady:hasArtAsset('pet.region01.starSlime'),skillsReady:group(['skill.starBlade','skill.meteorCombo','skill.starBurst','skill.astralShield']),uiReady:group(['ui.battleHud','ui.skillFrame','ui.bossBarFrame','ui.hpBarFrame','ui.panelFrame'])};
}
