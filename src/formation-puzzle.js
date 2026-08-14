export const FORMATION_TYPES = ['slot-1', 'slot-2', 'slot-3', 'slot-4', 'slot-5'];

export const FORMATION_ORBS = {
  'slot-1': { icon: '1', name: '一號位・赤紅', color: 'red' },
  'slot-2': { icon: '2', name: '二號位・湛藍', color: 'blue' },
  'slot-3': { icon: '3', name: '三號位・翠綠', color: 'green' },
  'slot-4': { icon: '4', name: '四號位・金黃', color: 'yellow' },
  'slot-5': { icon: '5', name: '五號位・星紫', color: 'purple' }
};

const index = (row, col) => row * 6 + col;
const adjacent = (a, b) => Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs(a % 6 - b % 6) === 1;
export const getActiveFormationTypes = party => FORMATION_TYPES.filter((_, slot) => Boolean(party?.[slot]));

export function getFormationMaxUses(battle) {
  if (battle?.worldBoss) return 3;
  if (battle?.boss) return 2;
  return 1;
}

export function ensureFormation(battle) {
  if (!battle) return null;
  const old = battle.formation || {};
  battle.formation = {
    gauge: Math.max(0, Math.min(100, Number(old.gauge) || 0)), uses: Math.max(0, Number(old.uses) || 0),
    maxUses: getFormationMaxUses(battle), active: Boolean(old.active), board: Array.isArray(old.board) ? old.board : [],
    result: old.result || null, lastResult: old.lastResult || null, startedAt: Number(old.startedAt) || 0,
    activeTypes: Array.isArray(old.activeTypes) && old.activeTypes.length ? old.activeTypes : [...FORMATION_TYPES]
  };
  return battle.formation;
}

export function addFormationGauge(battle, amount) {
  const formation = ensureFormation(battle);
  if (!formation || formation.uses >= formation.maxUses) return formation?.gauge || 0;
  formation.gauge = Math.min(100, formation.gauge + Math.max(0, Number(amount) || 0));
  return formation.gauge;
}

export function findMatches(board) {
  const matched = new Set(), groups = [];
  for (let row = 0; row < 5; row++) for (let start = 0; start < 6;) {
    let end = start + 1;
    while (end < 6 && board[index(row, end)]?.type === board[index(row, start)]?.type) end++;
    if (end - start >= 3) { const cells=[]; for(let col=start;col<end;col++){cells.push(index(row,col));matched.add(index(row,col));} groups.push({type:board[index(row,start)].type,cells}); }
    start=end;
  }
  for (let col = 0; col < 6; col++) for (let start = 0; start < 5;) {
    let end=start+1;
    while(end<5&&board[index(end,col)]?.type===board[index(start,col)]?.type)end++;
    if(end-start>=3){const cells=[];for(let row=start;row<end;row++){cells.push(index(row,col));matched.add(index(row,col));}groups.push({type:board[index(start,col)].type,cells});}
    start=end;
  }
  return { matched:[...matched], groups };
}

export function swapBoardCells(board, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || !adjacent(from, to) || board[from]?.locked) return false;
  [board[from], board[to]] = [board[to], board[from]];
  return true;
}

export function hasAvailableMove(board) {
  for(let i=0;i<30;i++)for(const j of[i+1,i+6])if(j<30&&adjacent(i,j)&&!board[i]?.locked){
    [board[i],board[j]]=[board[j],board[i]];const possible=findMatches(board).matched.length>0;[board[i],board[j]]=[board[j],board[i]];if(possible)return true;
  }
  return false;
}

function shuffle(values,rng){for(let i=values.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;}
function makeTypePool(types,rng){
  const pool=[];
  types.forEach(type=>{for(let n=0;n<4;n++)pool.push(type);});
  while(pool.length<30)pool.push(types[Math.floor(rng()*types.length)%types.length]);
  return shuffle(pool,rng);
}

function interferenceFor(battle,rng){
  const result={locked:new Set(),burning:new Set()};
  const phase=Number(battle?.worldBossPhase??battle?.enemies?.find(enemy=>enemy.worldBoss)?.phase)||1;
  if(!battle?.worldBoss||phase<2)return result;
  const key=battle.worldBossId||battle.enemies?.[0]?.id,target=key==='netherThunder'?result.locked:result.burning;
  const count=phase>=3?5+Math.floor(rng()*3):3+Math.floor(rng()*3);
  while(target.size<count)target.add(Math.floor(rng()*30));
  return result;
}

export function createFormationBoard(battle={},rng=Math.random,party=null){
  const types=getActiveFormationTypes(party||[]);
  const activeTypes=types.length?types:(battle?.formation?.activeTypes?.length?battle.formation.activeTypes:FORMATION_TYPES);
  let typePool=null;
  for(let attempt=0;attempt<80;attempt++){
    const candidate=makeTypePool(activeTypes,rng);
    const board=candidate.map((type,i)=>({id:`orb-${i}-${Math.floor(rng()*1e6)}`,type,locked:false,burning:false}));
    if(!findMatches(board).matched.length&&hasAvailableMove(board)){typePool=candidate;break;}
  }
  if(!typePool)typePool=makeTypePool(activeTypes,rng);
  const board=typePool.map((type,i)=>({id:`orb-${i}-${Math.floor(rng()*1e6)}`,type,locked:false,burning:false}));
  const interference=interferenceFor(battle,rng);
  interference.locked.forEach(i=>{board[i].locked=true;});interference.burning.forEach(i=>{board[i].burning=true;});
  return board;
}

export function comboMultiplier(combos){
  if(combos<=1)return 1;
  return ({2:1.15,3:1.35,4:1.6,5:1.9,6:2.25})[combos]||2.25+(combos-6)*.25;
}

export function matchSizeMultiplier(size){return size<=3?1:size===4?1.25:size===5?1.5:1.5+(size-5)*.12;}

export function getFormationActions(resolution,party=[]){
  const byType=new Map();
  for(const group of resolution.groups){
    const current=byType.get(group.type)||{groups:0,matched:0,power:0};
    current.groups++;current.matched+=group.cells.length;current.power+=(group.cells.length/3)*matchSizeMultiplier(group.cells.length);byType.set(group.type,current);
  }
  return party.map((member,slot)=>{
    const type=FORMATION_TYPES[slot],match=byType.get(type);
    return {slot,type,member,active:Boolean(member&&match),groups:match?.groups||0,matched:match?.matched||0,multiplier:(match?.power||0)*comboMultiplier(resolution.combos)};
  });
}

export function resolveFormationBoard(input,rng=Math.random,activeTypes=null){
  const board=input.map(cell=>({...cell})),groups=[];
  const types=activeTypes?.length?activeTypes:[...new Set(board.map(cell=>cell.type))].filter(Boolean);
  let cascades=0,removedBurning=0;
  while(cascades<12){
    const match=findMatches(board);if(!match.matched.length)break;cascades++;
    match.groups.forEach(group=>groups.push({...group,cascade:cascades}));const removed=new Set(match.matched);
    removed.forEach(i=>{if(board[i]?.burning)removedBurning++;});
    for(let col=0;col<6;col++){
      const survivors=[];for(let row=4;row>=0;row--){const cell=board[index(row,col)];if(!removed.has(index(row,col)))survivors.push(cell);}
      for(let row=4,n=0;row>=0;row--,n++)board[index(row,col)]=survivors[n]||{id:`sky-${cascades}-${row}-${col}-${Math.floor(rng()*1e6)}`,type:types[(Math.floor(rng()*types.length)+row+col+cascades)%types.length],locked:false,burning:false};
    }
  }
  return {board,groups,combos:groups.length,cascades,removedBurning,burningRemaining:board.filter(cell=>cell.burning).length};
}

export function startFormationPuzzle(battle,party,rng=Math.random){
  const formation=ensureFormation(battle);if(!formation||battle.finished||formation.active||battle.mode!=='puzzle')return false;
  formation.gauge=0;formation.uses++;formation.active=true;formation.result=null;formation.activeTypes=getActiveFormationTypes(party);
  if(!formation.activeTypes.length)formation.activeTypes=[FORMATION_TYPES[0]];
  formation.board=createFormationBoard(battle,rng,party);formation.startedAt=Date.now();return true;
}

export function preparePuzzleTurn(battle,party,rng=Math.random){
  const formation=ensureFormation(battle);if(!formation||battle?.mode!=='puzzle'||battle.finished)return false;
  formation.active=false;formation.result=null;return startFormationPuzzle(battle,party,rng);
}

export function settleFormationPuzzle(battle,party,rng=Math.random){
  const formation=ensureFormation(battle);if(!formation?.active)return null;
  const resolution=resolveFormationBoard(formation.board,rng,formation.activeTypes),actions=getFormationActions(resolution,party);
  formation.active=false;formation.board=resolution.board;formation.result={...resolution,actions};formation.lastResult=formation.result;return formation.result;
}
