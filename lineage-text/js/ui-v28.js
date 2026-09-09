import{UI}from'./ui.js?v=38';

const previousMore=UI.prototype.more;
UI.prototype.more=function(player){return previousMore.call(this,player).replace(/<button data-evolve="[^"]+">進化：Lv\.[^<]+<\/button>/g,'')};
const previousBind=UI.prototype.bind;
UI.prototype.bind=function(){previousBind.call(this);document.querySelectorAll('[data-evolve]').forEach(button=>button.onclick=()=>this.g.evolve(button.dataset.evolve))};
