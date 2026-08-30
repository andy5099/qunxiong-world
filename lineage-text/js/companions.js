import{PET_CLASS_LIMIT,petExpNeed,totalControlUsed,remainingControl}from'./balance.js?v=5';import{PET_TYPES,SUMMON_TYPES,PET_EVOLUTIONS,controlCapacity}from'./systems.js?v=3';
export function companionAttack(p){let pets=p.pets.filter(x=>p.activePets.includes(x.uid)&&x.alive),sum=p.summons[0],sd=sum?SUMMON_TYPES.find(x=>x.id===sum.type):null;return Math.floor(pets.reduce((n,pet)=>{let pd=PET_TYPES.find(x=>x.id===pet.type);return n+(pd?.atk||0)*(pet.evolutionMultiplier||1)*(1+pet.level/20)},0)+(sd?.atk||0))}
export const petControl=pet=>((pet.evolution||0)>0?PET_EVOLUTIONS[pet.type]?.[(pet.evolution||0)-1]?.control:0)||PET_TYPES.find(t=>t.id===pet.type)?.control||0;
export function togglePet(p,uid){let pet=p.pets.find(x=>x.uid===uid);if(!pet||!pet.alive)return false;let i=p.activePets.indexOf(uid);if(i>=0){p.activePets.splice(i,1);return true}if(p.activePets.length>=PET_CLASS_LIMIT[p.cls])return false;let used=p.activePets.reduce((n,id)=>n+petControl(p.pets.find(x=>x.uid===id)),0),need=petControl(pet);if(used+need>controlCapacity(p.stats.cha))return false;p.activePets.push(uid);return true}
export function evolvePet(p,uid){let pet=p.pets.find(x=>x.uid===uid),stage=pet?.evolution||0,e=PET_EVOLUTIONS[pet?.type]?.[stage];if(!pet||!e||pet.level<e.level||(p.bossMaterials[e.material]||0)<e.count)return false;p.bossMaterials[e.material]-=e.count;pet.evolution=stage+1;pet.name=e.name;pet.evolutionMultiplier=e.mult;pet.hp=Math.floor(pet.hp*e.mult);return true}
export function summon(p,id){let t=SUMMON_TYPES.find(x=>x.id===id),ring=Object.values(p.equipment).some(x=>x?.id==='summon-ring');if(!t||p.cls!=='法師'||p.level<t.level||!p.learnedSkills.includes(t.skill)||(t.ring&&!ring)||remainingControl(p)<t.control)return false;p.summons=[{type:id,hp:t.hp}];return true}
export function petWin(p,battleExp=10){let pets=p.pets.filter(x=>p.activePets.includes(x.uid)&&x.alive),share=pets.length?Math.max(1,Math.floor(battleExp/pets.length)):0;for(let pet of pets){pet.exp+=share;while(pet.exp>=petExpNeed(pet.level)){pet.exp-=petExpNeed(pet.level);pet.level++;pet.hp+=8}}}
export function companionDeath(p){for(let pet of p.pets)if(p.activePets.includes(pet.uid)){pet.alive=false;pet.hp=0}p.activePets=[];p.summons=[]}





