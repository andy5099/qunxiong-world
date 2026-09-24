import { writeFile } from 'node:fs/promises';
import { taixu } from '../data/worlds/taixu.js';
import { createState } from '../src/state.js';
import { StoryEngine } from '../src/story-engine.js';
import { applyChoice } from '../src/choice-engine.js';
import { exportSave } from '../src/save.js';
let state=createState(taixu);state.started=true;const engine=new StoryEngine(taixu);
for(const id of ['greet','cake','shield','invite','sync','credit','su-respect','together','train','pastry']) {const scene=await engine.scene(state);state=applyChoice(state,taixu,scene.choices.find(c=>c.id===id));}
await writeFile(new URL('./playable-save.json',import.meta.url),exportSave(state));
console.log('Created tests/playable-save.json: chapter complete, moon event available.');
