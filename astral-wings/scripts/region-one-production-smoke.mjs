import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getSpriteFrame, isSpriteAnimationComplete } from '../src/astral-world/sprite-renderer.js';

const library = JSON.parse(await readFile(new URL('../ASSET_MANIFEST.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('../assets/game-art/manifest.json', import.meta.url), 'utf8'));
assert.equal(library.version, 1);
assert.equal(manifest.version, 4);
const integratedPaths = new Set(Object.values(manifest.assets).map(asset => `assets/game-art/${asset.src}`));
for (const [id, asset] of Object.entries(library.assets)) {
  if (id === 'ui.button-set' || id === 'ui.bar-set' || id === 'ui.top-menu-buttons' || id === 'ui.icon-set') continue;
  assert.ok(integratedPaths.has(asset.path), `${id} is not connected to the runtime manifest`);
}
for (const id of manifest.bundles.region01) assert.ok(manifest.assets[id], `missing bundled definition: ${id}`);
assert.equal(getSpriteFrame({frameCount:4,fps:8,elapsed:.5,loop:false}),3);
assert.equal(isSpriteAnimationComplete({frameCount:4,fps:8,elapsed:.5}),true);
assert.equal(isSpriteAnimationComplete({frameCount:4,fps:8,elapsed:.2}),false);
console.log('Region 1 complete asset integration smoke: PASS');
