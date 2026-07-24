import { ENEMIES } from '../data/enemyData.js';
import { pick } from './utils.js';

// 由資料表建立獨立怪物；普通、菁英、頭目各有不同遭遇機率。
export function createRandomEnemy() { const roll=Math.random(); const tier=roll<.7?'普通':roll<.92?'菁英':'頭目'; const base=pick(ENEMIES.filter(enemy=>enemy.tier===tier)); return {...base, hp:base.hp, maxHp:base.hp}; }
export function resolveDrops(enemy) { return enemy.drops.filter(drop=>Math.random()<drop.chance).map(drop=>drop.id); }
