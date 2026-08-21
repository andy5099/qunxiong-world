import { FORMATION_ORBS, swapBoardCells } from './formation-puzzle.js?v=v031-rematch-1';

const TURN_MS = 6000;
let activePuzzle = null;

function paintCell(context,index){
  const node=context.cells[index],cell=context.battle.formation.board[index];if(!node||!cell)return;
  const info=FORMATION_ORBS[cell.type];
  node.className=`formation-orb orb-${cell.type}${cell.locked?' locked':''}${cell.burning?' burning':''}`;
  node.firstElementChild.textContent=info.icon;node.setAttribute('aria-label',`${info.name}${cell.locked?'，鎖定':''}`);
}

function clearDragVisual(context){
  const node=context.dragNode;if(!node)return;node.classList.remove('dragging');node.style.removeProperty('--drag-x');node.style.removeProperty('--drag-y');context.dragNode=null;
}

function updateDragVisual(context){
  const node=context.cells[context.current];if(!node)return;if(context.dragNode!==node)clearDragVisual(context);
  const rect=node.getBoundingClientRect();
  node.style.setProperty('--drag-x',`${context.latestX-(rect.left+rect.width/2)}px`);
  node.style.setProperty('--drag-y',`${context.latestY-(rect.top+rect.height/2)}px`);
  node.classList.add('dragging');context.dragNode=node;
}

function adjacentStep(from,to){
  const fromRow=Math.floor(from/6),fromCol=from%6,toRow=Math.floor(to/6),toCol=to%6;
  if(fromCol!==toCol)return from+(toCol>fromCol?1:-1);
  if(fromRow!==toRow)return from+(toRow>fromRow?6:-6);
  return from;
}

function flushPointerMove(context){
  context.moveRaf=0;if(!context.dragging)return;
  const hit=document.elementFromPoint(context.latestX,context.latestY)?.closest('[data-orb-index]');
  if(hit&&context.boardNode.contains(hit)){
    const target=Number(hit.dataset.orbIndex),next=adjacentStep(context.current,target);
    if(next!==context.current&&swapBoardCells(context.battle.formation.board,context.current,next)){
      const previous=context.current;context.current=next;paintCell(context,previous);paintCell(context,next);
    }
  }
  updateDragVisual(context);
}

function updateTimer(context,now){
  if(!context.dragging||context.settled)return;
  const remaining=Math.max(0,context.deadline-now),ratio=remaining/TURN_MS;
  context.clock.textContent=(remaining/1000).toFixed(1);context.fill.style.transform=`scaleX(${ratio})`;
  const state=ratio<.2?'danger':ratio<=.5?'warning':'normal';
  context.clock.dataset.timerState=state;context.track.dataset.timerState=state;
  if(remaining<=0){finishFormationPuzzle();return;}
  context.timerRaf=requestAnimationFrame(next=>updateTimer(context,next));
}

export function cleanupPuzzleBattle(){
  const context=activePuzzle;if(!context)return;
  if(context.moveRaf)cancelAnimationFrame(context.moveRaf);if(context.timerRaf)cancelAnimationFrame(context.timerRaf);
  context.boardNode.removeEventListener('pointerdown',context.onDown);
  context.boardNode.removeEventListener('pointermove',context.onMove);
  context.boardNode.removeEventListener('pointerup',context.onRelease);
  context.boardNode.removeEventListener('pointercancel',context.onRelease);
  document.removeEventListener('visibilitychange',context.onVisibility);
  if(context.pointerId!==null&&context.boardNode.hasPointerCapture?.(context.pointerId))try{context.boardNode.releasePointerCapture(context.pointerId);}catch{}
  clearDragVisual(context);context.dragging=false;context.pointerId=null;activePuzzle=null;
}

export function finishFormationPuzzle(){
  const context=activePuzzle;if(!context||context.settled)return false;
  context.settled=true;if(context.moveRaf){cancelAnimationFrame(context.moveRaf);context.moveRaf=0;flushPointerMove(context);}
  const settle=context.onSettle;cleanupPuzzleBattle();settle();return true;
}

export function unmountFormationPuzzle(){cleanupPuzzleBattle();}

export function mountFormationPuzzle(root,battle,onSettle){
  cleanupPuzzleBattle();
  const boardNode=root.querySelector('.formation-puzzle-board'),clock=root.querySelector('.formation-time'),track=root.querySelector('.puzzle-timer-track'),fill=root.querySelector('.puzzle-timer-fill');
  if(!boardNode||!clock||!track||!fill||!battle?.formation?.active)return;
  const context={root,battle,onSettle,boardNode,clock,track,fill,cells:[...boardNode.querySelectorAll('[data-orb-index]')],dragNode:null,dragging:false,current:-1,pointerId:null,latestX:0,latestY:0,deadline:0,moveRaf:0,timerRaf:0,settled:false};
  context.onDown=event=>{
    if(context.dragging)return;const orb=event.target.closest('[data-orb-index]');if(!orb)return;
    const at=Number(orb.dataset.orbIndex);if(context.battle.formation.board[at]?.locked)return;
    event.preventDefault();context.dragging=true;context.current=at;context.pointerId=event.pointerId;context.latestX=event.clientX;context.latestY=event.clientY;
    context.deadline=performance.now()+TURN_MS;boardNode.setPointerCapture(event.pointerId);updateDragVisual(context);updateTimer(context,performance.now());
  };
  context.onMove=event=>{
    if(!context.dragging||event.pointerId!==context.pointerId)return;event.preventDefault();context.latestX=event.clientX;context.latestY=event.clientY;
    if(!context.moveRaf)context.moveRaf=requestAnimationFrame(()=>flushPointerMove(context));
  };
  context.onRelease=event=>{if(!context.dragging||event.pointerId!==context.pointerId)return;event.preventDefault();finishFormationPuzzle();};
  context.onVisibility=()=>{if(document.hidden&&context.dragging)finishFormationPuzzle();};
  boardNode.addEventListener('pointerdown',context.onDown);
  boardNode.addEventListener('pointermove',context.onMove);
  boardNode.addEventListener('pointerup',context.onRelease);
  boardNode.addEventListener('pointercancel',context.onRelease);
  document.addEventListener('visibilitychange',context.onVisibility);
  activePuzzle=context;
}
