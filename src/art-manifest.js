export const ART_MANIFEST = Object.freeze({
  version: 'v032a-art-1',
  characters: {
    'liu-bei': { battle: './assets/qunxiong/characters/battle/liu-bei.webp', portrait: './assets/qunxiong/characters/portraits/liu-bei.webp', anchor: [.5, .88] },
    'guan-yu': { battle: './assets/qunxiong/characters/battle/guan-yu.webp', portrait: './assets/qunxiong/characters/portraits/guan-yu.webp', anchor: [.5, .88] },
    'zhang-fei': { battle: './assets/qunxiong/characters/battle/zhang-fei.webp', portrait: './assets/qunxiong/characters/portraits/zhang-fei.webp', anchor: [.5, .88] }
  },
  bosses: { 'crimson-tiger': { battle: './assets/qunxiong/bosses/crimson-tiger.webp', anchor: [.5, .62], visualWidth: 154, visualHeight: 154, offsetY: 5 } },
  backgrounds: { crimson: './assets/qunxiong/backgrounds/crimson-arena.webp' }
});
export function getArtDefinition(group, id) { return ART_MANIFEST[group]?.[id] || null; }
