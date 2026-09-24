import { AIProvider } from './ai-provider.js';
export const PROVIDER_PRESETS=Object.freeze({openai:{baseURL:'https://api.openai.com/v1',model:'gpt-4.1-mini'},openrouter:{baseURL:'https://openrouter.ai/api/v1',model:'cognitivecomputations/dolphin-mistral-24b-venice-edition'}});
export const DEFAULT_AI_CONFIG=Object.freeze({provider:'openai',model:'gpt-4.1-mini',baseURL:'https://api.openai.com/v1',temperature:0.9});
export function validateConfig(raw) {
  if(!['openai','openrouter','compatible','proxy'].includes(raw.provider))throw new Error('請選擇 Provider');
  const model=String(raw.model||'').trim();if(!model||model.length>100)throw new Error('請填寫模型 ID');
  const baseURL=Object.hasOwn(PROVIDER_PRESETS,raw.provider)?PROVIDER_PRESETS[raw.provider].baseURL:String(raw.baseURL||'').trim().replace(/\/+$/,'');
  let url;try{url=new URL(baseURL);}catch{throw new Error('Base URL 格式錯誤');}
  if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw new Error('端點須使用 HTTPS；本機 localhost 可用 HTTP，URL 不可夾帶金鑰');
  const temperature=Number(raw.temperature);if(!Number.isFinite(temperature)||temperature<0||temperature>2)throw new Error('Creativity 必須介於 0–2');
  return {provider:raw.provider,model,baseURL,temperature};
}
// Separate, opt-in device credentials; never part of a game archive.
export const CREDENTIALS_KEY='dreamWorldDeviceCredentialsV1';
export class SessionCredentials {
  #key=''; #config={...DEFAULT_AI_CONFIG}; #storage; #remember=false; #entries={};
  #storageError='';
  get storageError(){return this.#storageError;}
  constructor(storage=null){
    try{this.#storage=typeof storage==='function'?storage():storage;const raw=JSON.parse(this.#storage?.getItem(CREDENTIALS_KEY)||'null');
      if(raw?.version===1 && raw.entries && typeof raw.entries==='object')for(const [id,e] of Object.entries(raw.entries)){
        try{const config=validateConfig(e.config);if(id===this.#id(config)&&typeof e.key==='string'&&e.key.trim()&&e.key.length<=500)this.#entries[id]={config,key:e.key};}catch{}
      }
      if(raw?.last && this.#entries[raw.last]){const e=this.#entries[raw.last];this.#config=e.config;this.#key=e.key;this.#remember=true;}
    }catch{this.#storageError='無法讀取裝置金鑰；請重新輸入，或檢查瀏覽器儲存權限。';}
  }
  #id(c=this.#config){return c.provider+'|'+c.baseURL;}
  #write(entries,last){
    try{if(!this.#storage)throw new Error();const value=JSON.stringify({version:1,entries,last});this.#storage.setItem(CREDENTIALS_KEY,value);if(this.#storage.getItem(CREDENTIALS_KEY)!==value)throw new Error();this.#entries=entries;this.#storageError='';}
    catch{this.#storageError='無法保存或清除裝置金鑰，請檢查瀏覽器儲存權限；尚未確認成功。';throw new Error(this.#storageError);}
  }
  configure(config,key=''){
    const next=validateConfig(config);
    if(this.#id()!==this.#id(next)){const saved=this.#entries[this.#id(next)];this.#key=saved?.key||'';this.#remember=!!saved;}
    this.#config=next;if(key.trim())this.#key=key.trim();
  }
  selectProvider(provider){
    const saved=Object.values(this.#entries).find(e=>e.config.provider===provider);
    this.configure(saved?.config||{...DEFAULT_AI_CONFIG,provider,...(PROVIDER_PRESETS[provider]||{baseURL:'https://example.com/v1'})});
  }
  setRemember(enabled){
    const entries={...this.#entries},id=this.#id();
    if(enabled){if(!this.#key)throw new Error('請先輸入 API Key，再啟用記住金鑰。');entries[id]={config:this.config,key:this.#key};}
    else delete entries[id];
    if(enabled||this.#entries[id]){this.#remember=false;this.#write(entries,enabled?id:null);}
    this.#remember=enabled;
  }
  clear(){this.#key='';this.#remember=false;}
  clearSaved(){const entries={...this.#entries};delete entries[this.#id()];this.clear();this.#write(entries,null);}
  get config(){return {...this.#config};}
  get hasKey(){return !!this.#key;}
  get remembered(){return this.#remember;}
  get maskedKey(){return this.hasKey?(this.#config.provider==='openrouter'?'sk-or-v1-••••••••••••':'••••••••••••'):'';}
  adapter(options={}){if(!this.#key)throw new Error('AI 暫不可用：尚未設定 API Key／Proxy Token。請到「設定 → AI 劇情」設定連線。');return new ChatCompletionsAdapter(this.#config,this.#key,options);}
}
export class ChatCompletionsAdapter extends AIProvider {
  #key;
  constructor(config,key,{fetchImpl=globalThis.fetch,timeoutMs=45000}={}){super();this.config=validateConfig(config);this.#key=key;this.fetch=fetchImpl.bind(globalThis);this.timeoutMs=timeoutMs;}
  async generateScene({system,context}) {
    const controller=new AbortController();let timer;
    const request=async()=>{
      let response;
      try{response=await this.fetch(this.config.baseURL+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.#key}`},body:JSON.stringify({model:this.config.model,temperature:this.config.temperature,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(context)}],max_tokens:6000}),signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer'});}catch{throw new Error('無法連線。請確認網路、HTTPS、Provider 的 CORS 或使用自己的 Proxy。');}
      if(!response.ok)throw new Error(response.status===429?'AI 暫不可用：Provider 額度不足或請求過於頻繁（429），未切換離線模式':response.status===402?'AI 暫不可用：帳戶額度不足（402）':response.status===401||response.status===403?'API Key／Proxy Token 無效或沒有模型權限':`Provider 請求失敗（HTTP ${response.status}）`);
      let body;try{body=await response.json();}catch{throw new Error('Provider 回傳無效 JSON');}
      const choice=body?.choices?.[0];if(choice?.finish_reason && choice.finish_reason!=='stop')throw new Error('AI 回應未完整生成，請重新生成');
      const content=choice?.message?.content;if(typeof content!=='string'||content.length>60000)throw new Error('AI 回應為空或過長');
      try{return JSON.parse(content);}catch{throw new Error('AI 回傳 malformed JSON，尚未變更存檔');}
    };
    try{return await Promise.race([request(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('AI 請求逾時，尚未變更存檔'));},this.timeoutMs);})]);}finally{clearTimeout(timer);controller.abort();}
  }
  async testConnection(){const result=await this.generateScene({system:'Return JSON only: {"ok":true}. This is a connection test.',context:{test:true}});if(result?.ok!==true)throw new Error('模型未通過 JSON 連線測試');return true;}
}
