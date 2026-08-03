export function getSpriteFrame({ frameCount=1, fps=1, elapsed=0, loop=true, powerSave=false }={}) {
  const count=Math.max(1,Math.floor(frameCount));const rate=Math.max(.1,powerSave?Math.min(fps,6):fps);const raw=Math.max(0,Math.floor(elapsed*rate));return loop?raw%count:Math.min(count-1,raw);
}
export function isSpriteAnimationComplete({frameCount=1,fps=1,elapsed=0,powerSave=false}={}){const rate=Math.max(.1,powerSave?Math.min(fps,6):fps);return elapsed*rate>=Math.max(1,frameCount);}

export function drawSpriteAnimation(ctx,image,options={}) {
  if(!ctx||!image||!image.complete||!image.naturalWidth)return false;
  const {frameWidth,frameHeight,sourceX=0,sourceY=0,sourceHeight=frameHeight,drawWidth=frameWidth,drawHeight=frameHeight,frameCount=1,frameOffset=0,fps=8,elapsed=0,x=0,y=0,scale=1,anchorX=.5,anchorY=.5,flipX=false,loop=true,powerSave=false}=options;
  if(!frameWidth||!sourceHeight||!drawWidth||!drawHeight)return false;const frame=frameOffset+getSpriteFrame({frameCount,fps,elapsed,loop,powerSave});
  const sx=sourceX+frame*frameWidth;
  if(sx<0||sourceY<0||sx+frameWidth>image.naturalWidth+.5||sourceY+sourceHeight>image.naturalHeight+.5)return false;
  ctx.save();ctx.translate(x,y);ctx.scale(flipX?-scale:scale,scale);ctx.drawImage(image,sx,sourceY,frameWidth,sourceHeight,-drawWidth*anchorX,-drawHeight*anchorY,drawWidth,drawHeight);ctx.restore();return true;
}

export function drawCoverImage(ctx,image,width,height){
  if(!ctx||!image||!image.complete||!image.naturalWidth)return false;const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight),sw=width/scale,sh=height/scale,sx=(image.naturalWidth-sw)/2,sy=(image.naturalHeight-sh)/2;ctx.drawImage(image,sx,sy,sw,sh,0,0,width,height);return true;
}
