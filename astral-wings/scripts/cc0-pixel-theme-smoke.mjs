import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));
const manifest = readJson('../assets/game-art/manifest.json');
const animations = readJson('../assets/game-art/cc0/characters/jotem/animations.json');
const grid = readJson('../assets/game-art/cc0/characters/jotem/jotem-grid.json');

assert.equal(grid.grid.frameWidth, 128);
assert.equal(grid.grid.frameHeight, 128);
assert.equal(grid.rows.length, 12);
assert.equal(animations.animations.idle.confidence, 'high');
assert.equal(animations.animations.attack.frameCount, 10);
assert.deepEqual(animations.animations.death.rows, [9, 10, 11]);
assert.equal(animations.animations.death.frameCount, 30);

const required = [
  ...Array.from({ length: 12 }, (_, row) => `cc0.character.jotem.row${String(row).padStart(2, '0')}`),
  'cc0.monster.region01.starSlime', 'cc0.monster.region01.moonRabbit', 'cc0.monster.region01.starBeetle',
  'cc0.boss.region01.crownedBeast', 'cc0.pet.region01.starSlime', 'cc0.background.region01.field',
];
for (const id of required) assert.ok(manifest.assets[id], `missing manifest asset ${id}`);
assert.deepEqual(new Set(manifest.bundles['cc0-region01']), new Set(required));

const saveSource = fs.readFileSync(new URL('../src/astral-world/save.js', import.meta.url), 'utf8');
assert.match(saveSource, /artTheme:\s*'current'/);
assert.match(saveSource, /artTheme === 'cc0-pixel'/);

const rendererSource = fs.readFileSync(new URL('../src/astral-world/renderer.js', import.meta.url), 'utf8');
assert.match(rendererSource, /shouldUseCc0PixelTheme/);
assert.match(rendererSource, /drawCc0PixelPlayer/);
assert.match(rendererSource, /drawCc0PixelMonster/);
assert.match(rendererSource, /drawCc0PixelPet/);

console.log('CC0 pixel theme smoke: PASS');
