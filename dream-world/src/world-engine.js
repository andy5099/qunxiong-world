import { taixu } from '../data/worlds/taixu.js';
export const worlds = new Map([[taixu.id, taixu]]);
export function getWorld(id) { const world = worlds.get(id); if (!world) throw new Error('不支援的世界'); return world; }
export function registerWorld(world) {
  for (const key of ['id','name','theme','description','playerRole','locations','rules','stats','characters','events','memory','flags','mediaStyle']) if (world[key] == null) throw new Error(`世界缺少 ${key}`);
  if (worlds.has(world.id)) throw new Error('世界 ID 已存在');
  worlds.set(world.id, world);
}
export function statLabel(def, value) { return def.labels?.[value] ?? `${value}${def.unit || ''}`; }
