import { events, customActions } from '../events/taixu.js';
export const taixu = {
  id:'taixu',name:'太虛仙緣',theme:'修仙',description:'一場始於青玄山門的相遇。有人教你修行，有人陪你入夢；而每一次選擇，都有人記得。',playerRole:{name:'白見微',age:24,identity:'青玄宗新弟子',abilities:['太虛仙體','太虛夢境']},
  locations:[{id:'gate',name:'青玄山門'},{id:'bamboo',name:'青玄竹林'},{id:'dream',name:'太虛夢境'},{id:'pavilion',name:'聽雨閣'}],
  rules:['修行循序漸進；能力不代表可以越過他人的界線。','共夢需要雙方自願，任何一方都可以停止。','選擇改變信任、好感、親密與重要記憶。'],
  stats:{realm:{name:'境界',initial:1,min:1,max:9,labels:{1:'煉氣一層',2:'煉氣二層',3:'煉氣三層'}},cultivation:{name:'修為',initial:0,min:0,max:9999,unit:'點'},insight:{name:'靈識',initial:1,min:0,max:9999,unit:'點'}},
  characters:['shen','su','gu'],events,customActions,startScene:'arrival',hubScene:'hub',memory:'初至青玄宗，太虛仙體尚未甦醒。',flags:{'event:moon':false},mediaStyle:{palette:'墨青與月金',mood:'安靜、朦朧、東方幻想'},
  sceneSuffix(state) { return state.flags['met:shen'] ? this.attitudes[state.characters.shen.relationship] : ''; },
  attitudes:{'陌生人':'她仍保持著一段距離，等你用行動證明自己。','相識':'「又是你。」她抬眼，話裡已少了幾分疏離。','朋友':'「給你留了茶。」她推過杯子，像這早已是習慣。','曖昧':'「別靠那麼近……也沒叫你走。」她低下頭，假裝整理衣袖。','戀人':'她輕輕勾住你的手指。「今天，先陪我一會兒。」','伴侶':'她把燈留給你，連沉默都顯得安心。'}
};
