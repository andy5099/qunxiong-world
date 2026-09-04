import{UI}from'./ui.js?v=38';
import{CONSUMABLES}from'./data.js?v=53';
delete CONSUMABLES.魔力藥水;
const previousMore=UI.prototype.more;
UI.prototype.more=function(p){return previousMore.call(this,p).replace(/<label><input[^>]+id="auto-mana"[\s\S]*?<\/label>/g,'').replace(/<label>魔力藥水目標[\s\S]*?<\/label>/g,'')};
