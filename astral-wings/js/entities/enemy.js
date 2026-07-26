import{enemies}from'../data/enemies.js';export const enemy=(kind,x)=>{const d=enemies[kind];return{...d,kind,x,y:-30,r:16,phase:Math.random()*6,fireCd:1,shield:kind==='elite'?90:0,maxHp:d.hp};};
