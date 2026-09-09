import{UI}from'./ui.js?v=38';
import{groupEquipment}from'./inventory.js?v=44';
import{protectedEnhance}from'./enhance.js?v=61';
import{WEAPON_MAGIC}from'./equipment-v29.js?v=61';
import{BOSS_SETS}from'./systems.js?v=60';
import{unlocked,normalTransform}from'./transformations.js?v=61';

const previousTown=UI.prototype.town;
UI.prototype.town=function(player){return previousTown.call(this,player).replace(/<aside><section class="panel"><h2>王武工匠<\/h2>[\s\S]*?<\/section><\/aside>/,'<aside><section class="panel"><h2>裝備取得</h2><p>中高階裝備改由高階地圖與原始 Boss 直接掉落；舊製作材料與既有裝備仍完整保留。</p></section></aside>')};

const previousMore=UI.prototype.more;
UI.prototype.more=function(player){let forms=unlocked(player).filter(x=>x.requiredRebirth),active=normalTransform(player);return previousMore.call(this,player).replace('<h2>設定與存檔</h2>',`<h2>轉生專屬變身</h2><p>目前：${active?.name||'未使用'}・已解鎖 ${forms.length} 種</p>${forms.map(x=>`<button class="card" data-rebirth-transform="${x.id}"><b>${x.name}</b><br><small>${x.requiredRebirth}轉・普通攻擊速度實際生效・不影響技能 CD</small></button>`).join('')||'<p>3轉後開始永久解鎖。</p>'}<h2>設定與存檔</h2>`) };

const previousGroup=UI.prototype.equipmentGroup;
UI.prototype.equipmentGroup=function(index){previousGroup.call(this,index);let player=this.g.s.player,group=groupEquipment(player.bag)[index],item=group?.item;if(!item)return;this.modal.innerHTML=this.modal.innerHTML.replace(/<br>來源：[^<]*/g,'');let magic=WEAPON_MAGIC[item.id],set=BOSS_SETS.find(x=>x.id===item.bossSet),worn=set?Object.values(player.equipment).filter(x=>x?.bossSet===set.id).length:0,extra=`${magic?`<p><b>武器魔法：${magic.name}</b><br>發動率 ${Math.round(magic.proc*100)}%・普通命中追加魔法傷害・不消耗 MP</p>`:''}${set?`<p><b>${set.name}套裝 ${worn}/${set.pieces.length}</b><br>2件：${JSON.stringify(set.effects[2])}<br>3件：${JSON.stringify(set.effects[3])}<br>全套：${JSON.stringify(set.effects[set.pieces.length])}</p>`:''}`;this.modal.querySelector('.modal').insertAdjacentHTML('beforeend',extra+`<button id="protected-enhance">使用防爆${item.slot==='武器'?'武器':'防具'}強化卷軸</button>`);this.modal.querySelector('#protected-enhance').onclick=()=>{let r=protectedEnhance(player,item.instanceId||item.uid);this.modal.innerHTML='';this.g.persist('protected-enhance');this.g.ui.toast(r.ok?'防爆強化成功！':r.reason==='scroll'?'防爆強化卷軸不足。':'強化失敗，裝備完整保留。')}};

const previousBind=UI.prototype.bind;
UI.prototype.bind=function(){previousBind.call(this);document.querySelectorAll('[data-rebirth-transform]').forEach(button=>button.onclick=()=>this.g.transform(button.dataset.rebirthTransform))};
