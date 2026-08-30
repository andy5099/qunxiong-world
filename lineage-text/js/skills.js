import{SKILL_DEFS,BOOK_SOURCES}from'./systems.js?v=2';
export const skillsFor=p=>SKILL_DEFS[p.cls]||[];
export function learnSkill(p,name){let s=skillsFor(p).find(x=>x[0]===name);if(!s||p.level<s[1]||!p.skillBooks[name]||p.learnedSkills.includes(name))return false;p.skillBooks[name]--;p.learnedSkills.push(name);if(s[2]==='active'&&p.activeSkillSettings.attack.length<2)p.activeSkillSettings.attack.push(name);if(s[2]==='recover'&&!p.activeSkillSettings.heal)p.activeSkillSettings.heal=name;return true}
export function skillDrop(enemy,p,rng=Math.random){let names=skillsFor(p).filter(s=>BOOK_SOURCES[s[0]]===enemy.name&&!p.learnedSkills.includes(s[0]));if(names.length&&rng()<.09){let n=names[0][0];p.skillBooks[n]=(p.skillBooks[n]||0)+1;return n}return null}
export function passive(p,name){return p.learnedSkills.includes(name)}
export function activeSkill(p){return skillsFor(p).find(s=>p.activeSkillSettings.attack.includes(s[0])&&p.mp>=s[3])}
export function healSkill(p){return skillsFor(p).find(s=>s[0]===p.activeSkillSettings.heal&&p.learnedSkills.includes(s[0])&&p.mp>=s[3])}
