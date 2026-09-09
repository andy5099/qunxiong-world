const FRAME_COUNT=5;
const POSE={idle:0,flying:1,attack:2,skill:3,hit:4};
export const CHARACTER_VISUALS={
 guanyu:{asset:'guanyu',width:74,height:82,anchorX:.5,anchorY:.62},
 zhangfei:{asset:'zhangfei',width:78,height:84,anchorX:.5,anchorY:.62},
 liubei:{asset:'liubei',width:72,height:80,anchorX:.5,anchorY:.62},
 lubu:{asset:'lubuPixel',width:78,height:86,anchorX:.5,anchorY:.62}
};
function poseFor(entity,state){
 if(state==='hit'||entity.hitCd>.12)return 'hit';
 if(state==='skill'||entity.skillPose>0)return 'skill';
 if(Math.hypot(entity.vx,entity.vy)>520)return 'attack';
 if(Math.hypot(entity.vx,entity.vy)>130)return 'flying';
 return 'idle';
}
export function drawCharacter(ctx,entity,assets,{state,alpha=1,x=entity.x,y=entity.y,scale=1}={}){
 const visual=CHARACTER_VISUALS[entity.character]||CHARACTER_VISUALS.guanyu;
 const image=assets[visual.asset];
 if(!image?.complete||!image.naturalWidth)return false;
 const pose=POSE[poseFor(entity,state)]??0,sw=image.naturalWidth/FRAME_COUNT,sh=image.naturalHeight;
 const width=visual.width*scale,height=visual.height*scale;
 ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
 if(entity.stars>=5){ctx.shadowBlur=18;ctx.shadowColor=entity.character==='guanyu'?'#5dffc2':entity.character==='zhangfei'?'#ff5649':entity.character==='liubei'?'#ffe073':'#ff3d32'}
 ctx.translate(x,y);ctx.scale(entity.vx<0?-1:1,1);
 ctx.drawImage(image,pose*sw,0,sw,sh,-width*visual.anchorX,-height*visual.anchorY,width,height);
 ctx.restore();return true;
}
export function drawBossCharacter(ctx,boss,assets,{phase=1,hit=false,broken=false}={}){
 const image=assets.lubuPixel;if(!image?.complete||!image.naturalWidth)return false;
 const pose=broken||hit?4:boss.dashing?2:phase===3?3:0,sw=image.naturalWidth/FRAME_COUNT,sh=image.naturalHeight;
 const width=124,height=138;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(boss.x,boss.y);ctx.scale(boss.vx<0?-1:1,1);
 if(hit){ctx.globalCompositeOperation='screen';ctx.filter='brightness(2.3) saturate(.35)'}
 ctx.drawImage(image,pose*sw,0,sw,sh,-width*.5,-height*.62,width,height);ctx.restore();return true;
}
export function drawSpriteAfterimages(ctx,entity,assets,trail){
 if(Math.hypot(entity.vx,entity.vy)<330)return;
 for(let i=3;i<trail.length;i+=4){const p=trail[i];if(p)drawCharacter(ctx,entity,assets,{x:p.x,y:p.y,alpha:Math.max(.05,.26-i*.012),scale:1-i*.008})}
}
