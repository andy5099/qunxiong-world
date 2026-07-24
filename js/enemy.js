import { ENEMIES } from '../data/enemyData.js';
import { pick } from './utils.js';

// 由資料表建立獨立怪物，避免戰鬥改動原始資料。
export function createRandomEnemy() { const base=pick(ENEMIES); return {...base, hp:base.hp, maxHp:base.hp}; }
export function resolveDrops(enemy) { return enemy.drops.filter(drop=>Math.random()<drop.chance).map(drop=>drop.id); }
