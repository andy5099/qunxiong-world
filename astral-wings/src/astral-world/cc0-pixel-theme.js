import { getArtAsset, hasArtAsset } from './art-asset-manager.js';
import { drawSpriteAnimation, getSpriteFrame } from './sprite-renderer.js';

export const CC0_PIXEL_ASSET_IDS = [
  ...Array.from({ length: 12 }, (_, row) => `cc0.character.jotem.row${String(row).padStart(2, '0')}`),
  'cc0.monster.region01.starSlime', 'cc0.monster.region01.moonRabbit', 'cc0.monster.region01.starBeetle',
  'cc0.boss.region01.crownedBeast', 'cc0.pet.region01.starSlime', 'cc0.background.region01.field',
];

export function isCc0PixelThemeReady() { return CC0_PIXEL_ASSET_IDS.every(hasArtAsset); }
export function shouldUseCc0PixelTheme(state) { return state?.settings?.artTheme === 'cc0-pixel' && state?.mapId === 1 && isCc0PixelThemeReady(); }
export function getCc0PixelBackground() { return getArtAsset('cc0.background.region01.field'); }

const rowId = row => `cc0.character.jotem.row${String(row).padStart(2, '0')}`;
const single = {
  idle: { row: 0, frames: 6, fps: 10, loop: true },
  move: { row: 1, frames: 8, fps: 10, loop: true },
  skill: { row: 6, frames: 10, fps: 10, loop: false },
  attack: { row: 7, frames: 10, fps: 10, loop: false },
  hurt: { row: 8, frames: 5, fps: 10, loop: false },
};

function actionElapsed(animation, battle, time) {
  if (animation === 'idle' || animation === 'move') return time;
  const duration = animation === 'attack' ? .24 : animation === 'hurt' ? .28 : .52;
  const total = single[animation].frames / single[animation].fps;
  return Math.max(0, Math.min(1, (duration - (battle.playerActionIn || 0)) / duration)) * total;
}

export function drawCc0PixelPlayer(ctx, state, battle, x, y, time) {
  const action = battle.playerAction || 'idle';
  const downed = action === 'downed' || battle.reviveIn > 0;
  if (downed) {
    const elapsed = Math.max(0, Math.min(3, 3 - (battle.reviveIn || 0)));
    const frame = getSpriteFrame({ frameCount: 30, fps: 10, elapsed, loop: false, powerSave: state.settings?.powerSave });
    const segment = frame < 12 ? { row: 9, local: frame } : frame < 24 ? { row: 10, local: frame - 12 } : { row: 11, local: frame - 24 };
    return drawSpriteAnimation(ctx, getArtAsset(rowId(segment.row)), { frameWidth:128, frameHeight:128, frameCount:1, frameOffset:segment.local, fps:10, elapsed:0, x, y, drawWidth:176, drawHeight:176, anchorX:.5, anchorY:.9, loop:false, powerSave:state.settings?.powerSave });
  }
  const animation = action === 'hurt' || battle.playerFlash > 0 ? 'hurt' : action.startsWith('skill') ? 'skill' : action === 'attack' ? 'attack' : action === 'move' ? 'move' : 'idle';
  const definition = single[animation];
  return drawSpriteAnimation(ctx, getArtAsset(rowId(definition.row)), { frameWidth:128, frameHeight:128, frameCount:definition.frames, fps:definition.fps, elapsed:actionElapsed(animation,battle,time), x, y, drawWidth:176, drawHeight:176, anchorX:.5, anchorY:.9, loop:definition.loop, powerSave:state.settings?.powerSave });
}

const enemyIds = { slime:'cc0.monster.region01.starSlime', rabbit:'cc0.monster.region01.moonRabbit', beetle:'cc0.monster.region01.starBeetle' };

export function drawCc0PixelMonster(ctx, enemy, { time=0, x=278, y=267, attackIn=1 }={}) {
  const id = enemy.boss ? 'cc0.boss.region01.crownedBeast' : enemyIds[enemy.visualType];
  const image = id && getArtAsset(id); if (!image) return null;
  const boss = Boolean(enemy.boss), dying = enemy.action === 'death', hurt = enemy.action === 'hurt' || enemy.hit > 0;
  const deathRatio = dying ? Math.max(0, (enemy.deathIn || 0) / (enemy.deathDuration || .46)) : 1;
  const spawnRatio = enemy.spawnIn ? Math.max(.08, 1 - enemy.spawnIn / (enemy.spawnDuration || .36)) : 1;
  const attack = enemy.action === 'attack' || attackIn < .23;
  const bob = Math.sin(time * (boss ? 1.8 : 3)) * (boss ? 2 : 4);
  const drawX = x + (hurt ? -7 : 0) + (attack ? -10 * Math.sin(Math.min(1, Math.max(0, .23-attackIn)/.23) * Math.PI) : 0);
  const drawY = y + bob + (dying ? (1-deathRatio)*18 : 0);
  const size = boss ? 154 : 86 * (enemy.elite ? 1.2 : 1);
  ctx.save(); ctx.imageSmoothingEnabled=false; ctx.globalAlpha=deathRatio*spawnRatio; ctx.translate(drawX,drawY); const scale=(dying ? .72 : 1)*spawnRatio; ctx.scale(scale,scale);
  ctx.drawImage(image,-size*.5,-size*.86,size,size);
  if(hurt){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.55;ctx.drawImage(image,-size*.5,-size*.86,size,size);}
  ctx.restore();
  return { x:drawX, y:drawY, scale:1, rage:boss&&enemy.hp/enemy.maxHp<.4, alpha:deathRatio*spawnRatio };
}

export function drawCc0PixelPet(ctx, pet, options={}, x=142, y=300) {
  if (!pet || pet.sourceKind !== 'slime') return false;
  const image=getArtAsset('cc0.pet.region01.starSlime'); if(!image)return false;
  const attack=options.action==='attack'||options.action==='skill', progress=attack?Math.max(0,1-(options.actionIn||0)/.36):0;
  const travel=attack?Math.sin(Math.min(1,progress)*Math.PI)*58:0, bob=Math.sin((options.time||0)*4)*3;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x+travel,y+bob);ctx.drawImage(image,-32,-55,64,64);ctx.restore();return true;
}
