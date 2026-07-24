// 通用小工具：隨機、文字轉義與數值限制。
export const randomInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
export const pick = list => list[Math.floor(Math.random()*list.length)];
export const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
export const escapeHtml = text => String(text).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
