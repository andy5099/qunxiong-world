export const OBJECTIVES=[
 {id:'kill_first',title:'擊敗第一隻怪物',description:'自動戰鬥會持續攻擊目前怪物。',type:'kills',target:1,reward:{gold:30},next:'manual_skill',tutorial:true,page:'battle'},
 {id:'manual_skill',title:'手動施放一次技能',description:'點擊星刃斬技能卡可切換手動施放。',type:'manualSkill',target:1,reward:{gold:50},next:'level_two',tutorial:true,page:'battle'},
 {id:'level_two',title:'提升至 Lv.2',description:'擊敗怪物以獲得經驗。',type:'level',target:2,reward:{gold:80},next:'first_gear',tutorial:true,page:'battle'},
 {id:'first_gear',title:'取得第一件裝備',description:'怪物與 Boss 可能掉落裝備。',type:'gear',target:1,reward:{gold:100},next:'equip_first',tutorial:true,page:'inventory'},
 {id:'equip_first',title:'穿戴第一件裝備',description:'前往背包並選擇裝備。',type:'equip',target:1,reward:{gold:150},next:'compare_gear',tutorial:true,page:'inventory'},
 {id:'compare_gear',title:'查看裝備比較',description:'點擊背包裝備的詳情按鈕。',type:'inspect',target:1,reward:{gold:120},next:'enhance_first',tutorial:true,page:'inventory'},
 {id:'enhance_first',title:'首次強化',description:'將任意裝備強化至 +1。',type:'enhance',target:1,reward:{gold:180},next:'first_boss',tutorial:true,page:'battle'},
 {id:'first_boss',title:'擊敗星光草原 Boss',description:'擊殺 10 隻怪物後挑戰 Boss。',type:'bosses',target:1,reward:{gold:300},next:'first_pet',tutorial:true,page:'pets'},
 {id:'first_pet',title:'派出第一隻寵物',description:'在寵物頁選擇主戰寵物。',type:'pet',target:1,reward:{gold:220},next:'map_two',tutorial:true,page:'maps'},
 {id:'map_two',title:'進入第二張地圖',description:'擊敗第一區 Boss 後前往幽藍森林。',type:'map',target:2,reward:{gold:400},next:'level_five',tutorial:true,page:'maps'},
 {id:'level_five',title:'提升至 Lv.5',description:'持續探索並累積經驗。',type:'level',target:5,reward:{gold:500},next:'four_gear',page:'battle'},
 {id:'four_gear',title:'穿戴四件裝備',description:'用一鍵最佳裝備加快配置。',type:'equip',target:4,reward:{gold:600},next:'rare_gear',page:'inventory'},
 {id:'rare_gear',title:'取得稀有裝備',description:'挑戰 Boss 有較高掉落機率。',type:'rare',target:1,reward:{gold:700},next:'enhance_three',page:'inventory'},
 {id:'enhance_three',title:'裝備強化至 +3',description:'強化成功會立即提高戰力。',type:'enhance',target:3,reward:{gold:850},next:'boss_map_two',page:'inventory'},
 {id:'boss_map_two',title:'擊敗第二張地圖 Boss',description:'幽藍森林的 Boss 守著下一張地圖。',type:'bosses',target:2,reward:{gold:950},next:'pet_two',page:'battle'},
 {id:'pet_two',title:'寵物升至 2 星',description:'重複收服會獲得寵物碎片。',type:'petStar',target:2,reward:{gold:900},next:'power_1200',page:'pets'},
 {id:'power_1200',title:'戰力達到 1,200',description:'穿戴、強化與寵物都能提升戰力。',type:'power',target:1200,reward:{gold:1000},next:'epic_gear',page:'inventory'},
 {id:'epic_gear',title:'取得史詩裝備',description:'高階 Boss 擁有更高品質掉落。',type:'epic',target:1,reward:{gold:1100},next:'map_three',page:'inventory'},
 {id:'map_three',title:'前往第三張地圖',description:'擊敗第二區 Boss 後探索灼熱峽谷。',type:'map',target:3,reward:{gold:1150},next:'level_fifteen',page:'maps'},
 {id:'level_fifteen',title:'提升至 Lv.15',description:'繼續挑戰星界深處。',type:'level',target:15,reward:{gold:1200},next:null,page:'battle'},
];
const byId=id=>OBJECTIVES.find(o=>o.id===id);
export const UNLOCKS=[
 {id:'equipment',name:'裝備背包',description:'裝備掉落後可穿戴並比較戰力。',ready:s=>s.stats.equipment>0},
 {id:'pets',name:'星靈寵物',description:'收服的寵物能協同作戰。',ready:s=>s.stats.bosses>=1},
 {id:'mapTwo',name:'幽藍森林',description:'第二張地圖已開放探索。',ready:s=>s.highestMap>=2},
 {id:'autoBoss',name:'自動 Boss 挑戰',description:'可在設定中切換自動挑戰 Boss。',ready:s=>s.player.level>=10},
 {id:'skillUpgrade',name:'技能升級',description:'角色達 Lv.15 後可提升技能等級。',ready:s=>s.player.level>=15},
];
export function ensureUnlocks(state){state.unlocks??={claimed:[]};state.unlocks.claimed??=[];return state.unlocks;}
export function updateUnlocks(state){const store=ensureUnlocks(state),opened=[];for(const unlock of UNLOCKS){if(unlock.ready(state)&&!store.claimed.includes(unlock.id)){store.claimed.push(unlock.id);opened.push(unlock);}}return opened;}
export function ensureObjectives(state){state.objectives??={currentId:'kill_first',completed:[],claimed:[]};if(!state.objectives.currentId)state.objectives.currentId='kill_first';return state.objectives;}
export function progress(state,objective){const p=state.player;switch(objective.type){case'kills':return state.stats.kills;case'manualSkill':return state.tutorial?.manualSkills||0;case'level':return p.level;case'gear':return state.stats.equipment;case'equip':return Object.keys(state.equipped||{}).length;case'inspect':return state.tutorial?.inspected||0;case'enhance':return Math.max(0,...state.inventory.map(i=>i.enhance||0));case'bosses':return state.stats.bosses;case'pet':return state.activePetId?1:0;case'map':return state.highestMap;case'rare':return state.inventory.some(i=>['rare','epic','legendary','mythic','astral'].includes(i.quality))?1:0;case'epic':return state.inventory.some(i=>['epic','legendary','mythic','astral'].includes(i.quality))?1:0;case'power':return p.power;case'petStar':return Math.max(0,...state.pets.map(i=>i.stars||1));default:return 0;}}
export function currentObjective(state){return byId(ensureObjectives(state).currentId)||OBJECTIVES[0];}
export function updateObjective(state){const store=ensureObjectives(state),objective=currentObjective(state);if(progress(state,objective)<objective.target)return null;if(store.completed.includes(objective.id))return null;if(!store.claimed.includes(objective.id)){state.player.gold+=objective.reward.gold;store.claimed.push(objective.id);if(objective.tutorial){state.tutorial.rewardsClaimed??=[];state.tutorial.rewardsClaimed.push(objective.id);}}store.completed.push(objective.id);store.currentId=objective.next||objective.id;if(objective.id==='map_two'){state.tutorial.completed=true;state.tutorial.active=false;}return objective;}
