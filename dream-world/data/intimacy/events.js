export const privateEventData = {
  shen:{title:'她沒有先移開目光',text:'「剛才你看我的樣子，我看見了。」她的聲音很輕，卻沒有迴避。\n\n「如果是認真的，就認真問我。」',accept:'「我願意。」她耳尖泛紅，這次卻主動牽住你的手。',decline:'「今天先不了。」她把茶推給你，「但你可以坐在這裡陪我。」'},
  su:{title:'這一次，不是玩笑',text:'「一直逗你，是因為喜歡看你笑。」她放下茶盞，語氣難得認真。\n\n「不過今天，我想聽一句你的真心話。」',accept:'「終於等到你開口了。」她笑著接受邀約，說好今晚只聊彼此。',decline:'「今天的心情，適合喝茶。」她笑得坦然，「邀請我記住了，答案也請你記住。」'},
  gu:{title:'卷宗合上之後',text:'「以我的身份，有些話不容易說。」她移開卷宗，將對面的椅子拉近。\n\n「但現在，我只是想與你單獨待一會兒。」',accept:'她鄭重點頭。「是我自己的選擇。」卸下職責的片刻，她終於肯把疲倦說給你聽。',decline:'「今日不合適。」她語氣溫和卻明確，「你尊重這個答案，我會很感激。」'},
  default:{title:'留給彼此的時間',text:'對方停下腳步，認真聽你說話。你們都有選擇靠近或保持距離的自由。',accept:'對方欣然接受邀約，与你約好一起散步。',decline:'對方今天想保留自己的時間，你接受了這個答案。'}
};
export function privateEvent(id, card, profile, returnScene, worldId) {
  const d=privateEventData[id] || privateEventData.default;
  const choice=(key,label,result,changes,intimate=false)=>({id:`private-${key}`,label,hint:'雙方自願 · 依當下關係回應',next:returnScene,result,effects:{characters:{[id]:changes}},memoryEffects:[{text:result,character:id,important:true,intimate}],media:{type:'none',src:null,prompt:null}});
  return {id:`private:${id}`,title:d.title,eyebrow:'PRIVATE MOMENT / 私人邀約',text:d.text,speaker:card.name,intimacyEvent:true,repeatable:true,characters:[id],worldRequirement:worldId,requirements:{},relationshipRequirement:'相識',affectionRequirement:0,trustRequirement:10,intimacyRequirement:0,characterBoundaries:['consent','platonic'],media:{type:'none',src:null,prompt:null},choices:[
    {...choice('invite','坦白心意，詢問是否願意約會',d.accept,{affection:5,trust:3,intimacy:4},true),consentAction:{target:id,kind:'date',accepted:d.accept,declined:d.decline}},
    choice('listen','先問對方想要怎樣的陪伴',`${card.name}談起自己的期待。你認真聽完，也說出了自己的界線。`,{trust:5,affection:2}),
    choice('space','今天先到這裡，替彼此留點空間',`${card.name}接受你的決定。這一次，沒有誰需要為拒絕感到抱歉。`,{trust:3})
  ]};
}
export function socialEvent(id,card,returnScene,state) {
  const d=privateEventData[id]||privateEventData.default;
  const make=(key,label,result,changes)=>({id:key,label,hint:'相處 · 每個世界的關係獨立',next:returnScene,result,effects:{characters:{[id]:changes}},memoryEffects:[{text:result,character:id,important:true}],media:{type:'none',src:null,prompt:null}});
  return {id:`social:${id}`,title:`與${card.name}相處`,eyebrow:'TOGETHER / 成年角色互動',sceneText:d.text,media:{type:'none',src:null,prompt:null},choices:[
    make('listen-person','聽對方說今天最在意的事',`${card.name}把心事告訴你。你認真聽完，沒有急著替對方下結論。`,{trust:5,affection:3}),
    make('share-person','坦白自己的心情，分享一個小祕密',`你把自己的心情說給${card.name}聽。這份信任讓彼此更近了一點。`,{trust:3,affection:5,intimacy:2}),
    {...make('date-person','表達吸引，詢問是否願意約會',d.accept,{affection:5,intimacy:4}),consentAction:{target:id,kind:'date',accepted:d.accept,declined:d.decline}}
  ]};
}
