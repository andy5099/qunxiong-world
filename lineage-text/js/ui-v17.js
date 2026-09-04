import{UI}from'./ui.js?v=38';
const previousMore=UI.prototype.more,previousBattle=UI.prototype.battle,previousOffline=UI.prototype.offline;
UI.prototype.more=function(p){return previousMore.call(this,p)
 .replace(/<label><input[^>]+id="auto-green"[\s\S]*?<\/label>/g,`<label><input style="width:auto" type="checkbox" id="auto-green" ${p.settings.autoGreen?'checked':''}> 綠水自動使用</label>`)
 .replace(/<label><input[^>]+id="auto-brave"[\s\S]*?<\/label>/g,`<label><input style="width:auto" type="checkbox" id="auto-brave" ${p.settings.autoBrave?'checked':''}> 勇水自動使用</label>`)
 .replace(/<label><input[^>]+id="auto-supply"[\s\S]*?<\/label>/g,'')
 .replace(/<label><input[^>]+id="buy-heal"[\s\S]*?<\/label>/g,'')
 .replace(/<label><input[^>]+id="buy-arrow"[\s\S]*?<\/label>/g,'')
 .replace(/<label>箭矢目標[\s\S]*?<\/label>/g,'')
 .replace(/<label>補給方式[\s\S]*?<\/label>/g,'')
 .replace(/<label>固定補給箭矢[\s\S]*?<\/label>/g,'')
 .replace(/<label><input[^>]+id="supply-transform"[\s\S]*?<\/label>/g,'')
 .replace(/<label>目標 <input id="target-transform"[\s\S]*?<\/label>/g,'')
 .replace(/<label><input[^>]+id="supply-green"[\s\S]*?<\/label>/g,'')
 .replace(/<label><input[^>]+id="supply-brave"[\s\S]*?<\/label>/g,'')
 .replace(/<h2>自動補給<\/h2>/g,'<h2>自動使用</h2>')};
UI.prototype.battle=function(p){return previousBattle.call(this,p).replace(/<div class="kpi"><span>補給成本\/小時<\/span>[\s\S]*?<\/div>/g,'')};
UI.prototype.offline=function(o){previousOffline.call(this,{...o,cost:0,stopped:false});this.modal.querySelectorAll('.kpi').forEach(x=>{if(/自動補給|補給成本/.test(x.textContent))x.remove()})};
