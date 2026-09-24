const media = {type:'none',src:null,prompt:null};
const memory = (text, character='shen', intimate=false) => [{text,character,important:true,intimate}];
const c = (id,label,hint,next,result,effects={},memoryEffects=[],requirements={}) => ({id,label,hint,next,result,effects,memoryEffects,requirements,media});
const shen = (changes, extra={}) => ({characters:{shen:changes},...extra});
const event = (id,title,text,choices,extra={}) => ({id,title,text,choices,eyebrow:'太虛仙緣 / 第一卷',media,...extra});
export const events = {
  arrival:event('arrival','山門有雪，眼前有她','青玄宗的晨鐘穿過薄霧。你，白見微，剛以煉氣一層的修為走完九百級石階。\n\n一位月白劍袍的女子抱劍而立。\n\n「沈清霜。負責帶你入門。」她看了一眼你發抖的腿，「你就是新來的人？」',[
    c('greet','禮貌介紹自己','真誠 · 先把名字交給她','courtesy','「白見微……記住了。」她接過行囊，腳步刻意慢了半拍。',shen({affection:6,trust:8,status:'帶你入門',mood:'稍感安心'},{flags:{'met:shen':true,polite:true}}),memory('初見時，你認真介紹自己，她替你拿了行囊。')),
    c('tease','「師姐是在等我嗎？」','玩笑 · 試探她的反應','banter','「我在等所有新弟子。」她看著空無一人的石階，補了一句：「今天只有你。」',shen({affection:9,trust:1,mood:'耳尖微紅',status:'與你鬥嘴'},{flags:{'met:shen':true,teased:true}}),memory('初見時你逗她，她說今天只有你一個新弟子。')),
    c('scan','用太虛仙體觀察她','特殊能力 · 窺探可能越界','boundary','一道霜意切斷了探查。「看別人之前，先學會問。」她沒有拔劍，但向後退了一步。',shen({trust:-5,mood:'警戒',status:'要求你保持距離'},{flags:{'met:shen':true,scanned:true},stats:{insight:2}}),memory('你未經允許探查她，被她明確制止。'))
  ],{speaker:'沈清霜',aside:'天賦：太虛仙體。當前用途：爬樓梯後恢復呼吸。'}),
  courtesy:event('courtesy','她放慢的半步','她帶你經過竹林，問起你為何修行。石桌上放著兩塊桂花糕，她卻只拿走一塊。\n\n「剩下那個……別浪費。」',[
    c('cake','把桂花糕分她一半','分享 · 留下一段小記憶','trial','她說不餓，最後還是接了。「下次別徒手掰，笨。」',shen({affection:9,trust:5},{flags:{cake:true}}),memory('你第一次與她分享桂花糕。')),
    c('purpose','說想保護重要的人','坦誠 · 她在意你的動機','trial','「先學會保護自己。」她把護心訣第一句寫在你掌心旁的紙上。',shen({trust:10,affection:3},{stats:{insight:1}}),memory('你告訴她，修行是為了保護重要的人。')),
    c('honest','承認自己還沒想好','誠實 · 不急著裝成英雄','trial','她竟然笑了一下。「比那些說要拯救蒼生的，可信。」',shen({trust:8,affection:5}),memory('你坦白自己尚未找到修行的理由。'))
  ],{aside:'新手禮包：桂花糕 × 半。傳說級的人情味。'}),
  banter:event('banter','嘴上不讓，腳步卻停','「再貧嘴，就多跑十圈。」她把練習木劍遞到你面前，眼底卻沒有怒意。\n\n你注意到她握劍的虎口貼著新換的藥布。',[
    c('care','收起玩笑，問她手傷','關心 · 把分寸找回來','trial','她把手藏進袖口。「小傷……多謝。」這次沒有再加一句嘴硬的話。',shen({trust:10,affection:6}),memory('你察覺她的手傷，停止玩笑並關心她。')),
    c('challenge','接劍，認真請教一招','行動 · 贏得劍修的尊重','trial','「握穩。」她難得耐心示範了三遍，沒有嘲笑你第四次才學會。',shen({trust:7,affection:3},{stats:{cultivation:1}}),memory('你接下木劍，認真向她學了第一招。')),
    c('double','「十圈有師姐陪跑嗎？」','嘴硬 · 她真的會當真','detour','「有。我監督。」你用雙腿學會：有些玩笑按圈計費。',shen({affection:4,trust:-2},{flags:{extraLaps:true}}),memory('你又逗了她一次，換來十圈實打實的加練。'))
  ],{aside:'宿主修為：煉氣一層。嘴砲修為：暫時無法測量。'}),
  boundary:event('boundary','先問，才能靠近','她停在三步之外。太虛仙體仍能感到那道冰冷劍意。\n\n「能力不是通行證。」她說，「你打算怎麼做？」',[
    c('apology','道歉，承諾不再擅自探查','尊重 · 修復而非抹去記憶','trial','「我會記得你的承諾。」她收起劍意，卻仍保持了一點距離。',shen({trust:8,affection:2},{flags:{apologized:true}}),memory('你為擅自窺探道歉，承諾先取得允許。')),
    c('ask','詢問哪些資訊可以看','溝通 · 學會界線','trial','「公開的境界可以，其他不行。」她答得很清楚。這一次，你把能力收回了。',shen({trust:6},{stats:{insight:1},flags:{boundariesKnown:true}}),memory('她親口告訴你：公開境界可以看，內心不可以。')),
    c('stepback','先退開，獨自熟悉能力','距離 · 用行動停止窺探','detour','她點了點頭。竹林裡只剩你自己的呼吸，這次你把探查轉向落葉。',shen({trust:2},{stats:{insight:2},flags:{solo:true}}),memory('你選擇退開，在竹林獨自控制自己的能力。'))
  ],{aside:'太虛仙體沒有附贈「別人必須原諒你」功能。'}),
  detour:event('detour','竹影下的一個時辰','沒有近路，也沒有師姐代打。你在竹影下反覆調整呼吸，終於聽見靈脈裡微弱的回聲。\n\n遠處傳來集合鐘聲。',[
    c('finish','完成練習再去集合','守約 · 遲一步也要做完','trial','沈清霜看了你的鞋底一眼。「至少你沒有偷懶。」',shen({trust:7},{stats:{cultivation:2}}),memory('你獨自完成了練習，她注意到了。')),
    c('report','先回去如實報告進度','坦白 · 不假裝完成','trial','「剩下的明日補。」她把你安排在身邊，從頭示範。',shen({trust:6,affection:2},{stats:{cultivation:1}})),
    c('leaf','帶回靈脈異常的落葉','觀察 · 發現另一條線索','trial','葉脈竟泛著銀光。她神色一正：「待會兒跟緊我。」',shen({trust:4},{stats:{insight:2},flags:{leaf:true}}),memory('你帶回了帶有夢境氣息的銀色落葉。'))
  ]),
  trial:event('trial','試劍坪上的裂隙',s=>`${s.flags.leaf ? '那片銀葉忽然發燙。' : '木劍相交時，一道銀光在石縫中閃過。'}試劍坪下的舊陣驟然失控。\n\n沈清霜護住後方弟子，左肩卻被逸散的靈氣擦傷。你體內的太虛仙體，第一次主動回應了裂隙。`,[
    c('shield','協助她疏散弟子','可靠 · 先確保所有人安全','dreamGate','你接過她護住的人群，讓她騰出手封住裂隙。「做得好。」這次她沒有避開你的目光。',shen({trust:12,affection:6},{flags:{rescued:true},stats:{cultivation:2}}),memory('試劍坪失控時，你協助她保護了弟子。')),
    c('seal','以仙體感知陣眼','探索 · 找到夢境入口','dreamGate','你找到陣眼，也被震得坐倒在地。她伸手拉你起來：「下次先說，我替你護法。」',shen({trust:5,affection:4},{stats:{insight:3},flags:{seal:true}}),memory('你找出夢境陣眼，她把你從碎石中拉起。')),
    c('call','敲響警鐘，請長老支援','冷靜 · 承認當下的能力','dreamGate','長老及時趕到。她按住肩傷，向你微微點頭。「求援不是示弱。」',shen({trust:9,affection:3},{stats:{cultivation:1},flags:{calledHelp:true}}),memory('危急時你敲鐘求援，避免了更多人受傷。'))
  ],{aside:'煉氣一層救場指南：不用每一次都拿臉接大招。'}),
  dreamGate:event('dreamGate','今夜，夢有了門','夜色落進窗沿。太虛夢境在你掌中化作一圈柔和銀光。它能讓靈力共鳴，但邀請另一個人，需要對方願意。\n\n沈清霜前來歸還你的木劍。她望向那道光：「這是什麼？」',[
    c('invite','說明風險，再邀她同行','信任 ≥ 20 · 對方可以拒絕','sharedDream','「只試一刻鐘。不舒服就停。」她主動踏近一步，把護心符交給你。',shen({trust:5,affection:5},{flags:{dreamOpened:true,consent:true},location:'dream'}),memory('你說明夢境風險，她自願與你同行。'),{character:'shen',trust:20}),
    c('hesitant','誠實邀請，尊重她的猶豫','信任未足 · 先走自己的路','soloDream','「現在還不行。」她沒有答應，但替你點了安神香。「你先平安回來。」',shen({trust:5},{flags:{dreamOpened:true,declined:true},location:'dream'}),memory('她拒絕了第一次共夢邀請，你尊重了決定。'),{flags:{never:true}}),
    c('solo','先自己試探夢境','獨行 · 不讓她承擔未知','soloDream','你約定一刻鐘後醒來。她坐到門邊：「我替你守著。」',shen({trust:4},{flags:{dreamOpened:true},location:'dream'}),memory('你首次獨自入夢，她在門外替你守候。')),
    c('teach','請她先教你護心訣','穩妥 · 基礎比天賦可靠','preparation','「總算問了個像樣的問題。」她搬來第二把椅子，逐句講給你聽。',shen({trust:6,affection:3},{stats:{insight:1}}),memory('入夢前，她耐心教你護心訣。'))
  ],{aside:'夢境邀請不是組隊強拉。對方有拒絕按鈕。'}),
  preparation:event('preparation','一盞燈，兩道呼吸','最後一句護心訣落下，銀色夢門穩定了許多。她把寫滿批註的紙推給你。\n\n「現在，別急。告訴我你準備怎麼進去。」',[
    c('together','再次確認，邀她一起','信任 ≥ 20 · 共同入夢','sharedDream','「我願意。」她把手放在光的另一邊，與你同時閉眼。',shen({affection:5,trust:4},{flags:{dreamOpened:true,consent:true},location:'dream'}),memory('完成護心練習後，你們確認意願，一同入夢。'),{character:'shen',trust:20}),
    c('watch','請她在外面護法','安全 · 接受她的節奏','soloDream','「這個我可以。」她替你扶正符紙，約定以三次叩桌為醒來的訊號。',shen({trust:7},{flags:{dreamOpened:true},location:'dream'})),
    c('record','帶著筆記獨自探索','研究 · 記住每一條規則','soloDream','第一條筆記：夢裡的筆也會掉。第二條：師姐的護心訣確實有用。',{stats:{insight:2},flags:{dreamOpened:true},location:'dream'}),
    c('short','只做一次短暫入定','審慎 · 先驗證出口','soloDream','你先確認能自行醒來，才踏入更深的夢境。',{stats:{cultivation:1},flags:{dreamOpened:true},location:'dream'})
  ]),
  sharedDream:event('sharedDream','星河很近，她也是','太虛夢境沒有天地，只有一片安靜星河。沈清霜的衣袖浮在銀光中，她的呼吸逐漸與你同步。\n\n「別亂想。」她瞥你一眼，「靈力會聽見。」',[
    c('sync','先詢問，再掌心相抵','共修 · 自願的靠近','breakthrough','她點頭，把掌心輕輕貼上來。靈力沿兩人的經脈流轉，那道瓶頸終於鬆動。',shen({affection:8,trust:8,intimacy:8,mood:'安心'},{stats:{cultivation:5},flags:{sharedTraining:true}}),memory('第一次共修，你先詢問，她點頭後與你掌心相抵。','shen',true)),
    c('parallel','並肩打坐，保持距離','尊重 · 一樣可以共鳴','breakthrough','她安靜坐到你身旁。「這樣也很好。」兩道劍意在星河中交錯，互不侵擾。',shen({affection:5,trust:10,intimacy:4},{stats:{cultivation:5},flags:{sharedTraining:true}}),memory('第一次共修，你們並肩而坐，保留彼此的空間。','shen',true)),
    c('joke','「那妳聽見什麼了？」','調情 · 熟悉後她會回擊','breakthrough','「聽見有人靈力還沒嘴硬。」她耳尖微紅，卻沒有挪開座位。',shen({affection:10,trust:3,intimacy:6},{stats:{cultivation:4},flags:{sharedTraining:true}}),memory('星河共修時，你逗她，她紅著耳尖回擊。','shen',true))
  ],{aside:'系統提醒：靈力共鳴不是心聲廣播。宿主請勿自作多情。'}),
  soloDream:event('soloDream','一個人的星河','夢境裡，一道銀色石碑寫著你的名字。你聽見遠處三下叩擊——她還在門外守著。\n\n太虛仙體正把夢境裡的靈氣引入經脈。',[
    c('steady','循護心訣，穩定運轉','修煉 · 穩穩走完第一步','breakthrough','你如約醒來。她收起劍，像只是碰巧坐了一整夜。',shen({trust:8,affection:4},{stats:{cultivation:5},flags:{keptPromise:true}}),memory('第一次入夢，你如約醒來，沒有讓她久等。')),
    c('rune','記下石碑上的異紋','研究 · 為後續留下線索','breakthrough','你描下碑紋後醒來。她看見紙角的符號，神色忽然認真。',shen({trust:4},{stats:{cultivation:3,insight:3},flags:{rune:true}}),memory('你從夢碑帶回了一段未知碑紋。')),
    c('return','回應叩擊，提早醒來','回應 · 珍惜門外的守候','breakthrough','「我還好。」你一開口，她繃緊的肩膀就鬆了。「知道了，別特地說。」',shen({trust:9,affection:6},{stats:{cultivation:3}}),memory('你提前醒來，告訴守在門外的她自己平安。'))
  ]),
  breakthrough:event('breakthrough','第一道瓶頸，開了',s=>`靈氣在丹田緩緩凝成一線。${s.flags.sharedTraining ? '那道與你共鳴的霜色靈力，替你守住了最後一步。' : '昨夜的護心訣，替你守住了最後一步。'}\n\n你觸到了煉氣二層的門檻。\n\n一封帶著木香的請帖恰好送到：「聽說有人夢裡修行，醒來還有美人護法？——蘇媚璃」`,[
    c('credit','突破後，先向她道謝','承認陪伴 · 開啟聽雨閣','market','「是你自己走過來的。」她停頓一下，「但下次也可以找我。」',shen({affection:6,trust:5},{stats:{realm:1},flags:{breakthrough:true},location:'pavilion'}),memory('突破煉氣二層後，你第一個向她道謝。')),
    c('boast','「我是不是天才？」','輕鬆 · 收到一句熟悉的吐槽','market','「天才，鞋穿反了。」她忍了很久，終於笑出聲。',shen({affection:7},{stats:{realm:1},flags:{breakthrough:true},location:'pavilion'}),memory('突破那天，你得意忘形，她笑著指出你穿反的鞋。')),
    c('notes','整理經驗，交她參考','分享 · 不把機緣據為己有','market','她仔細收好筆記。「我會看的。」你的名字被她寫在頁首。',shen({trust:8},{stats:{realm:1,insight:1},flags:{breakthrough:true},location:'pavilion'}),memory('你把第一次突破的經驗整理給她。'))
  ],{aside:'恭喜突破！現在你從「很弱」變成了「有進步的很弱」。'}),
  market:event('market','聽雨閣，有人等著看戲','蘇媚璃倚在茶桌旁，輕輕推來第三隻茶盞。\n\n「別緊張。我只賣消息，不賣你們的秘密。」她望向沈清霜，笑得意味深長，「今天的茶，是一個人喝，還是兩個人分？」',[
    c('su-honest','坦白詢問夢碑的來歷','坦率 · 換取實用情報','summons','「直接，我喜歡。」她展開一張舊圖，指向宗門禁地。',{flags:{'met:su':true,map:true},characters:{su:{affection:5,trust:8,status:'邀你喝茶',mood:'欣賞'}}},memory('初見蘇媚璃，你直接向她詢問夢碑。','su')),
    c('su-flirt','「能先請掌事喝茶嗎？」','有來有往 · 她很會接話','summons','「可以呀。茶錢算你的，故事算我的。」她眨眼，把空茶盞遞過來。',{flags:{'met:su':true,tea:true},characters:{su:{affection:10,trust:3,status:'與你談笑',mood:'愉快'}}},memory('初見蘇媚璃，你請她喝茶，她用故事回禮。','su')),
    c('su-respect','先問清霜是否願意談昨夜','尊重 · 不替別人公開記憶','summons','清霜輕輕點頭。蘇媚璃收起笑意：「懂分寸的人，消息可以算便宜些。」',{flags:{'met:su':true,discreet:true},characters:{shen:{trust:7,affection:4},su:{trust:10,affection:3,status:'願意交換情報',mood:'認真'}}},memory('在聽雨閣，你先徵求清霜同意，才談起共同經歷。'))
  ],{speaker:'蘇媚璃',aside:'新角色登場。宿主的嘴砲榜首地位受到嚴重威脅。'}),
  summons:event('summons','一封來自宗主的信',s=>`蘇媚璃壓低聲音：「夢碑的事，宗主也在查。」${s.flags.rune || s.flags.map ? '她將你找到的線索與舊圖對照，兩者竟然吻合。' : '她留下一張夢碑拓印，提醒你先別冒進。'}\n\n門外，玄色衣袖掠過。顧傾城留下封信，只寫了八個字：\n\n「明日見我。帶上實話。」`,[
    c('truth','回信：必如實稟告','誠實 · 宗主記下你的態度','hub','回信很快送達。顧傾城在你的名字旁畫了一個小小的圈。',{flags:{'met:gu':true,chapterComplete:true},characters:{gu:{trust:8,status:'等待明日會面',mood:'審慎'}},location:'bamboo'},memory('你向顧傾城承諾如實說明太虛夢境。','gu')),
    c('together','邀清霜明日一同前往','同行 · 你不必獨自面對','hub','「我本來就會去。」她看向你，聲音比平日輕一些。',shen({affection:6,trust:5},{flags:{'met:gu':true,chapterComplete:true,withShen:true},location:'bamboo'}),memory('宗主召見之前，你邀清霜一起面對。')),
    c('su-advice','請蘇媚璃指點宗主脾氣','情報 · 為下個章節鋪路','hub','「別裝懂，別說謊。還有，」她笑了，「宗主其實記得每個人的名字。」',{flags:{'met:gu':true,chapterComplete:true,guAdvice:true},characters:{su:{trust:6,affection:4}},location:'bamboo'},memory('蘇媚璃告訴你，宗主記得每個人的名字。','su'))
  ],{aside:'支線任務：今晚睡好。難度：想到「明日見我」後突然很高。'}),
  hub:event('hub','故事未完，今夜還長',s=>`第一卷的風波暫歇。竹林的燈還亮著，聽雨閣也留著一壺茶。\n\n${s.flags['event:moon'] ? '你們在月下說過的話，已經成了彼此記得的事。' : s.characters.shen.trust >= 35 ? '沈清霜沒有急著回去，似乎還有話想說。' : '沈清霜正在擦劍。想走近一點，還需要把承諾變成日常。'}\n\n主線第一卷已完成。你可以繼續培養關係、共同修煉，或整理夢境記憶。`,[
    c('moon','赴一場月下之約','好感 40 / 信任 35 / 親密 12','moon','她把劍放下。「今晚不練劍，陪我走走吧。」',{},[],{character:'shen',affection:40,trust:35,intimacy:12,flags:{'event:moon':false}}),
    c('train','邀她再次共修','信任 ≥ 20 · 每次都重新確認','practice','「可以。還是老規矩，隨時能停。」',{},[],{character:'shen',trust:20}),
    c('walk','陪她整理試劍坪','日常 · 可靠比說得好聽有用','practice','你默默搬走碎石。她遞來一杯水，這次沒有找藉口。',shen({trust:6,affection:4}),memory('你陪她整理試劍坪，她主動遞水。')),
    c('visit','去聽雨閣喝一杯茶','蘇媚璃 · 茶裡有新消息','tea','蘇媚璃替你留著靠窗的位置。「這次想聽故事，還是說故事？」'),
    c('reflect','整理夢境中的線索','研究 · 為下一卷準備','practice','你把線索整理在紙上，再去請教清霜。',{stats:{insight:1}})
  ],{showAttitude:true,aside:'第一卷已通關，但關係不會自動滿級。陪伴才是日常任務。'}),
  practice:event('practice','把日常練成默契',s=>s.characters.shen.trust >= 20 ? '她確認你今日的狀態，才與你一同閉眼。夢裡的星河不再陌生。\n\n「今天，照你的步調。」' : '她還不願一同入夢，卻願意陪你從最基本的吐納開始。\n\n「先把眼前這一步做好。」',[
    c('listen','先聽她說今天的心情','傾聽 · 關係也需要練習','hub','她談起北境的一場雪。你沒有打斷，只替她添了茶。',shen({trust:5,affection:4,intimacy:4},{stats:{cultivation:2}}),memory('你安靜聽她說起北境的雪。','shen',true)),
    c('advance','循序練習，互相護法','修煉 · 不逞強','hub','一輪吐納結束，她對你點头。穩定的陪伴比冒進更讓人安心。',shen({trust:4,affection:3,intimacy:3},{stats:{cultivation:3}}),memory('你們循序練習，互相照看靈力的變化。','shen',true)),
    c('pastry','練習後，請她吃桂花糕','記憶 · 她記得這個味道','hub','「又是桂花糕。」她接過紙包，唇角卻沒有壓住。',shen({affection:6,trust:3,intimacy:4},{stats:{cultivation:1},flags:{cake:true}}),memory('練習之後，你為她準備了桂花糕。','shen',true))
  ],{showAttitude:true}),
  tea:event('tea','她的玩笑，與真心','「你每次來，清霜的劍都擦得特別慢。」蘇媚璃托腮看你，笑意裡藏著一點認真。\n\n「好了，今天不逗你。想聊什麼？」',[
    c('ask-su','問她今天過得如何','關心 · 情報商也需要被聽見','hub','她愣了片刻。「你倒是第一個不問消息的人。」茶香中，她說起忙碌的一天。',{characters:{su:{affection:7,trust:6,intimacy:2,mood:'放鬆'}}},memory('你去聽雨閣，只為問蘇媚璃今天過得如何。','su')),
    c('trade','分享一個自己的糗事','坦率 · 交換的不是祕密','hub','她笑得茶都忘了喝。「好，這故事我替你保密。」',{characters:{su:{affection:6,trust:5,intimacy:3,mood:'開懷'}}},memory('你向蘇媚璃分享糗事，她答應只留在茶桌。','su')),
    c('investigate','一起研究夢碑拓印','研究 · 留待下一卷的謎題','hub','拓印的一角亮起「歸夢」二字。她收好紙張：「下次，帶你見個人。」',{stats:{insight:1},flags:{nextClue:true},characters:{su:{trust:6,affection:2}}},memory('你與蘇媚璃在拓印上發現「歸夢」二字。','su'))
  ],{speaker:'蘇媚璃',aside:'情報可以明碼標價。有人關心你，通常不在價目表上。'}),
  moon:event('moon','月光不必替誰說話','沈清霜走在你身旁，腳步與初見時一樣慢。\n\n「以前只是怕你跟不上。」她看著月光，耳尖泛紅，「現在……是想多走一會兒。」\n\n她停下來，等你的回答。',[
    c('mutual','「我也想，和妳一直走下去。」','確認彼此心意 · 戀人','hub','她認真看著你。「那就說好了。」得到你的回應後，她才輕輕牽住你的手。',shen({affection:10,trust:8,intimacy:10,relationship:'戀人',mood:'溫柔',unlock:['secret','weakness']},{flags:{'event:moon':true,lovers:true}}),memory('月下，你們確認彼此心意，自願牽手成為戀人。','shen',true)),
    c('slow','「我很在意妳，想慢慢來。」','坦誠 · 保留自己的步調','hub','「我沒有催你。」她嘴上仍硬，卻笑了。「明晚也可以再走一段。」',shen({trust:10,affection:5,intimacy:5,unlock:['weakness']},{flags:{'event:moon':true,slowLove:true}}),memory('月下，你坦白想慢慢來，她尊重你的步調。','shen',true)),
    c('friend','「我珍惜妳，作為朋友。」','界線 · 友誼也是完整關係','hub','她安靜片刻，然後點頭。「好。那朋友，明天也別遲到。」',shen({trust:10,relationship:'朋友',unlock:['weakness']},{flags:{'event:moon':true,friendship:true}}),memory('月下，你們坦誠決定以朋友的身份相伴。'))
  ],{intimacyEvent:true,characters:['shen'],requirements:{flags:{chapterComplete:true}},relationshipRequirement:'朋友',affectionRequirement:40,trustRequirement:35,intimacyRequirement:12,worldRequirement:'taixu',effects:{},memoryEffects:[],aside:'這一次，系統決定安靜一點。'})
};
// Use an explicit complementary condition so every state has exactly three options.
events.dreamGate.choices[1].requirements = { character:'shen', maxTrust:19 };

export const customActions = [
  {keywords:['糕','送禮','禮物'],text:'你想準備一份心意。夢境提醒你：禮物不能代替詢問，也不能購買感情。',choices:[c('gift-plan','先問對方喜歡什麼','規劃 · 留下你的提議',null,'你記下了提議，準備在下一次合適的相處時詢問。',{},[{text:'你計畫先詢問喜好，再準備禮物。',important:true}]),c('gift-wait','等合適的時機再送','分寸',null,'你把心意留到更合適的時候。'),c('gift-back','收起提議，繼續眼前的事','返回',null,'你把注意力帶回眼前。')]},
  {keywords:['修煉','練劍','打坐'],text:'你先做了一輪呼吸練習。真正的突破仍需要正式修煉與同伴的配合。',choices:[c('breath','記下要練習的項目','規劃',null,'你列出了練習目標，沒有貿然打亂當前行程。',{},[{text:'你為下一次修煉列出練習目標。',important:true}]),c('question','整理一個請教的問題','思考',null,'你把不明白的地方記在紙上。'),c('continue','先完成當前的事','返回',null,'你穩定呼吸，繼續眼前的故事。')]},
  {keywords:[],text:'這個提議尚未有專屬劇本。你可以把它留作意圖，或回到眼前能實際採取的行動。',choices:[c('note','把提議記入旅途札記','記憶 · 不憑空改變世界',null,'你留下了一個新的行動意圖。',{},[{text:'你提出了劇本外的計畫，決定先觀察可行性。',important:true}]),c('observe','先觀察當前局勢','觀察',null,'你重新留意周圍的人與事，沒有擅自替任何人做決定。'),c('back','回到原本的行動','返回',null,'你決定先把眼前的事情做好。')]}
];
