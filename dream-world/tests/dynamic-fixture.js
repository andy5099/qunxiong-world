// Deterministic test fixture, never a production AI fallback.
import {response} from './ai-fixtures.js';
const events=['攔下信差','發現暗記','辨認足印','聽見求救','找出暗門','救出守衛','得知鐘樓遭佔領','截獲密信','識破假巡夜人','追回通行令','說服守衛','發現毒針','阻止警鐘','查出家徽','逼出內應','查明脅迫原因','接到人質訊號','找到藏身處','切斷敵人退路','救下人質','揭露幕後主使','收到旅程邀請'];
export function adventureResponse(context){
 const turn=context.PLAYER.turn,event=events[turn%events.length];
 return response({sceneText:`【本機模擬測試，非真實模型】山門前，沈清霜${event}。「有新線索了，下一步由你決定。」她主動擋住追兵。你剛才的行動：${context.ACTION.intent}。調查進入第 ${turn+1} 階段。`,location:context.WORLD.location,
 choices:[{label:`與清霜核對「${event}」的線索`,intent:`合作釐清${event}背後的原因`,risk:'花費時間交換情報'},{label:`直接追問「${event}」的嫌疑人`,intent:`冒險逼問${event}涉及的人物`,risk:'可能驚動追兵'},{label:`用誘餌試探「${event}」的幕後者`,intent:`設下假情報誘餌破解${event}的局面`,risk:'可能暴露位置'}],
 relationshipChanges:{shen:{met:true,status:`追查鐘樓陰謀：${event}`}},questUpdates:[{id:'bell-case',title:'鐘樓密函',description:event,status:turn>=20?'resolved':'active'}],
 memoryUpdates:turn>0&&turn%5===0?[{id:`milestone-${turn}`,text:event,character:'shen',kind:'event',importance:'major-choice'}]:[{id:`routine-${turn}`,text:`與清霜交談第 ${turn} 次`,character:'shen',kind:'event',importance:'routine'}]});
}
