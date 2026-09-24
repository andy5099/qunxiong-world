const make = (id, name, age, core, persona) => ({id,name,age,adult:true,...core,memories:[],relationship:'陌生人',affection:0,trust:0,intimacy:0,flags:{},portrait:null,media:{type:'none',src:null,prompt:null},personas:[{worldId:'taixu',...persona,worldMemories:[]}]});
export const characters = {
  shen:make('shen','沈清霜',26,{
    appearance:'霜色眼眸，烏髮束起。指節有常年練劍留下的薄繭。',corePersonality:'清冷、嘴硬、容易害羞；勝負欲強，熟悉後很會吐槽。',speechStyle:'短句，少修飾；關心常常說成提醒。',behavior:'先確認安全，再假裝只是順路幫忙。',relationshipStyle:'慢慢建立信任，重視並肩而行。',intimacyStyle:'含蓄、嘴硬；熟悉後會紅著耳尖反擊玩笑。',likes:'桂花糕、清晨練劍、守約的人',dislikes:'擅自窺探、逞強、拿承諾當玩笑',boundaries:'不接受未經允許讀取內心；身體接觸必須先詢問。',weakness:'不擅長坦率接受善意。',secret:'她每次多買一塊桂花糕，都說是店家送的。'
  },{identity:'青玄宗劍修',occupation:'劍修',abilities:'霜華劍意、護心訣',clothing:'月白窄袖劍袍，青玉髮簪',background:'自小修劍，成年後獨自守過三年北境。如今負責引導新弟子。'}),
  su:make('su','蘇媚璃',32,{
    appearance:'眉眼含笑，衣袖間有淡淡木香；看人時總像已知道下一句。',corePersonality:'成熟、主動、愛看熱鬧；表面從容，做事有分寸。',speechStyle:'語尾帶笑，喜歡反問；遇到真心話會放輕聲音。',behavior:'先逗你一句，再把真正有用的線索放到你手裡。',relationshipStyle:'喜歡有來有往的試探，更欣賞坦誠。',intimacyStyle:'主動調情，擅長親密玩笑；懂得在對方猶豫時停下。',likes:'好故事、直球回答、溫熱的茶',dislikes:'虛偽、強迫、把別人的隱私當趣聞',boundaries:'玩笑可以拒絕；秘密不等於交換感情的籌碼。',weakness:'習慣照顧別人，卻不習慣被照顧。',secret:'她收集的不是八卦，而是失落夢境的線索。'
  },{identity:'聽雨閣掌事',occupation:'情報商',abilities:'識夢術、符籙辨識',clothing:'暗朱色長衫，銀鈴繫在腰間',background:'在青玄宗經營聽雨閣，往來各地，消息比飛劍還快。'}),
  gu:make('gu','顧傾城',38,{
    appearance:'目光沉靜，玄色衣襟一絲不亂，言語未落便令人端坐。',corePersonality:'威嚴、理性、高冷、慢熱；對認定的人格外護短。',speechStyle:'精確簡潔，先問事實，再問動機。',behavior:'先承擔責任，之後才承認自己也會疲倦。',relationshipStyle:'尊重彼此的選擇，需要長期一致的行動。',intimacyStyle:'克制而認真；親近之後才展露柔軟與反差。',likes:'誠實、清茶、有始有終',dislikes:'推卸責任、空話、越界試探',boundaries:'職責與私人感情分開；不以權位要求親密。',weakness:'很難開口請別人分擔。',secret:'宗門禁地的夢碑上，也留著她的名字。'
  },{identity:'青玄宗宗主',occupation:'宗主',abilities:'玄天劍域、夢碑封印',clothing:'玄色宗主常服，白玉腰佩',background:'以理性與劍術守護宗門，近日開始調查太虛異夢。'})
};
