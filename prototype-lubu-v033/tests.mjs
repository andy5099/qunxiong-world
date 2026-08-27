import fs from 'node:fs';import assert from 'node:assert/strict';const js=fs.readFileSync(new URL('./game.js',import.meta.url),'utf8');assert.match(js,/qunxiong-world:prototype-lubu-v033/);assert.match(js,/PERFECT COUNTER/);assert.match(js,/天下無雙/);assert.match(js,/breakTime=3\.5/);assert.match(js,/d>=15&&first\?'legendary'/);assert.match(js,/normal:1,rare:2,epic:4,legendary:8/);assert.match(js,/Math\.pow\(d-1/);assert.ok(fs.existsSync(new URL('./assets/lubu.png',import.meta.url)));assert.ok(fs.existsSync(new URL('./assets/arena.png',import.meta.url)));console.log('Lu Bu prototype: 9 assertions passed');
for(const name of ['guanyu','zhangfei','liubei','lubu'])assert.ok(fs.existsSync(new URL(`./assets/${name}-pixel.png`,import.meta.url)));
assert.ok(fs.existsSync(new URL('./character-renderer.mjs',import.meta.url)));
assert.ok(fs.existsSync(new URL('./skill-vfx-renderer.mjs',import.meta.url)));
assert.doesNotMatch(js,/ctx\.arc\(e\.x,e\.y,16/);
assert.match(js,/drawSpriteAfterimages/);
console.log('Pixel Battle Pack: 8 assertions passed');
