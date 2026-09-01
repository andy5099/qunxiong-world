import{UI}from'./ui.js?v=26';
import{skillsFor}from'./skills.js?v=26';
import{setPotionSetting}from'./core-v12.js?v=26';

const previousMore=UI.prototype.more;
UI.prototype.more=function(p){let html=previousMore.call(this,p),active=skillsFor(p).filter(s=>s[2]==='active'&&p.learnedSkills.includes(s[0])),selected=p.activeSkillSettings.selectedActiveSkill||'未選擇',selector=`<h2>主動攻擊技能選擇</h2><p>目前使用：<b>${selected}</b></p><div class="cards">${active.map(s=>`<button class="card ${selected===s[0]?'active':''}" data-primary-skill="${s[0]}"><b>${s[0]}</b><br><small>MP ${s[3]}・CD ${s[5]||6}秒<br>設為主要攻擊技能</small></button>`).join('')||'<p>尚未學會主動攻擊技能。</p>'}</div><small>治癒技能仍依 HP 閾值獨立觸發；MP 不足時改用普通攻擊。</small>`;return html.replace('<h2>技能分類</h2>',selector+'<h2>技能分類</h2>').replace('綠水自動使用・自動補貨','綠水自動使用・自動購買').replace('勇水自動使用・自動補貨','勇水自動使用・自動購買')};

const previousCharacter=UI.prototype.character;
UI.prototype.character=function(p,d){let html=previousCharacter.call(this,p,d),buttons=Object.entries(p.equipment).filter(([,i])=>i).map(([slot,i])=>`<button data-unequip="${slot}">卸下 ${slot}：${i.name}</button>`).join('');return html.replace('</section>',`<h3>卸下裝備</h3><div class="actions">${buttons||'目前沒有裝備'}</div></section>`)};

const previousBattle=UI.prototype.battle;
UI.prototype.battle=function(p,d){let html=previousBattle.call(this,p,d),now=Date.now(),green=!((p.buffs.greenUntil||0)>now)&&p.settings.autoGreen&&(p.consumables.綠色藥水||0)===0,brave=!((p.buffs.braveUntil||0)>now)&&p.settings.autoBrave&&(p.consumables.勇敢藥水||0)===0;if(green)html=html.replace('<b>綠色藥水：未使用</b>','<b>綠色藥水：已用完</b>');if(brave)html=html.replace('<b>勇氣藥水：未使用</b>','<b>勇氣藥水：已用完</b>');return html};

const previousBind=UI.prototype.bind;
UI.prototype.bind=function(){previousBind.call(this);let p=this.g.s.player;document.querySelectorAll('[data-primary-skill]').forEach(b=>b.onclick=()=>this.g.selectActiveSkill(b.dataset.primarySkill));document.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>this.g.unequip(b.dataset.unequip));let bind=(id,key)=>{let x=document.querySelector(id);if(x)x.onchange=()=>{setPotionSetting(p,key,x.checked);this.g.persist()}};bind('#auto-green','autoGreen');bind('#auto-brave','autoBrave');bind('#supply-green','autoSupplyGreen');bind('#supply-brave','autoSupplyBrave')};
