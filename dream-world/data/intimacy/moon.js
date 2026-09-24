const media = {type:'none',src:null,prompt:null};
const memory = (text, character='shen', intimate=false) => [{text,character,important:true,intimate}];
const c = (id,label,hint,next,result,effects={},memoryEffects=[],requirements={}) => ({id,label,hint,next,result,effects,memoryEffects,requirements,media});
const shen = (changes, extra={}) => ({characters:{shen:changes},...extra});
const event = (id,title,text,choices,extra={}) => ({id,title,text,choices,eyebrow:'太虛仙緣 / 第一卷',media,...extra});
export const moonEvent=event('moon','月光不必替誰說話','沈清霜走在你身旁，腳步與初見時一樣慢。\n\n「以前只是怕你跟不上。」她看著月光，耳尖泛紅，「現在……是想多走一會兒。」\n\n她停下來，等你的回答。',[
    c('mutual','「我也想，和妳一直走下去。」','確認彼此心意 · 戀人','hub','她認真看著你。「那就說好了。」得到你的回應後，她才輕輕牽住你的手。',shen({affection:10,trust:8,intimacy:10,relationship:'戀人',mood:'溫柔',unlock:['secret','weakness']},{flags:{'event:moon':true,lovers:true}}),memory('月下，你們確認彼此心意，自願牽手成為戀人。','shen',true)),
    c('slow','「我很在意妳，想慢慢來。」','坦誠 · 保留自己的步調','hub','「我沒有催你。」她嘴上仍硬，卻笑了。「明晚也可以再走一段。」',shen({trust:10,affection:5,intimacy:5,unlock:['weakness']},{flags:{'event:moon':true,slowLove:true}}),memory('月下，你坦白想慢慢來，她尊重你的步調。','shen',true)),
    c('friend','「我珍惜妳，作為朋友。」','界線 · 友誼也是完整關係','hub','她安靜片刻，然後點頭。「好。那朋友，明天也別遲到。」',shen({trust:10,relationship:'朋友',unlock:['weakness']},{flags:{'event:moon':true,friendship:true}}),memory('月下，你們坦誠決定以朋友的身份相伴。'))
  ],{intimacyEvent:true,characters:['shen'],requirements:{flags:{chapterComplete:true}},relationshipRequirement:'朋友',affectionRequirement:40,trustRequirement:35,intimacyRequirement:12,worldRequirement:'taixu',effects:{},memoryEffects:[],aside:'這一次，系統決定安靜一點。'});
