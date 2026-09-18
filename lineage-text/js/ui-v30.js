import{UI}from'./ui.js?v=38';
const previousMaps=UI.prototype.maps;
UI.prototype.maps=function(player){let html=previousMaps.call(this,player).replace('狩獵地圖與地下城樓層（全部自由進入）','狩獵地圖（全部自由進入）');html=html.replace('<button data-map="56"','</div><h2>【打寶區】</h2><p>寶1～寶4無等級、轉生、門票或任務限制；由實際生存與擊殺效率檢驗成長。</p><div class="cards"><button data-map="56"');html=html.replace('<button data-map="52"','</div><h2>【四大龍・最終挑戰】</h2><div class="cards"><button data-map="52"');return html};
