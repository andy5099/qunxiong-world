export function safeMediaURL(src) {
  if(typeof src !== 'string' || !src) return null;
  try { const base=new URL('../',import.meta.url), url=new URL(src,base); return url.origin===base.origin && url.pathname.startsWith(base.pathname+'assets/') ? url.href : null; } catch { return null; }
}
export async function presentMedia(media, dialog, content) {
  const src=safeMediaURL(media?.src);
  if(!src || !['image','video'].includes(media.type)) return;
  await new Promise(resolve=>{
    content.replaceChildren();
    const element=document.createElement(media.type==='video'?'video':'img');
    element.src=src;
    if(media.type==='video') {element.controls=true;element.playsInline=true;} else element.alt=media.alt || '夢境事件畫面';
    const note=document.createElement('p');note.textContent='看完或略過後，繼續文字故事。';
    content.append(element,note);
    const done=()=>dialog.close();
    element.addEventListener('error',done,{once:true}); element.addEventListener('ended',done,{once:true});
    dialog.addEventListener('close',()=>{if(media.type==='video')element.pause();resolve();},{once:true});
    dialog.showModal();
  });
}
