import { AIProvider } from './ai-provider.js';
export const DEFAULT_AI_CONFIG=Object.freeze({provider:'openai',model:'gpt-4.1-mini',baseURL:'https://api.openai.com/v1',temperature:0.9});
export function validateConfig(raw) {
  if(!['openai','compatible','proxy'].includes(raw.provider))throw new Error('請選擇 Provider');
  const model=String(raw.model||'').trim();if(!model||model.length>100)throw new Error('請填寫模型 ID');
  const baseURL=raw.provider==='openai'?DEFAULT_AI_CONFIG.baseURL:String(raw.baseURL||'').trim().replace(/\/+$/,'');
  let url;try{url=new URL(baseURL);}catch{throw new Error('Base URL 格式錯誤');}
  if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw new Error('端點須使用 HTTPS；本機 localhost 可用 HTTP，URL 不可夾帶金鑰');
  const temperature=Number(raw.temperature);if(!Number.isFinite(temperature)||temperature<0||temperature>2)throw new Error('Creativity 必須介於 0–2');
  return {provider:raw.provider,model,baseURL,temperature};
}
// Intentionally no storage: even configuration URLs may contain private details.
export class SessionCredentials {
  #key=''; #config={...DEFAULT_AI_CONFIG};
  configure(config,key=''){const next=validateConfig(config);if(this.#config.provider!==next.provider||this.#config.baseURL!==next.baseURL)this.#key='';this.#config=next;if(key)this.#key=key.trim();}
  clear(){this.#key='';}
  get config(){return {...this.#config};}
  get hasKey(){return !!this.#key;}
  adapter(options={}){if(!this.#key)throw new Error('請先在「設定 → AI 劇情」輸入本次分頁使用的 API Key／Proxy Token');return new ChatCompletionsAdapter(this.#config,this.#key,options);}
}
export class ChatCompletionsAdapter extends AIProvider {
  #key;
  constructor(config,key,{fetchImpl=globalThis.fetch,timeoutMs=45000}={}){super();this.config=validateConfig(config);this.#key=key;this.fetch=fetchImpl.bind(globalThis);this.timeoutMs=timeoutMs;}
  async generateScene({system,context}) {
    const controller=new AbortController();let timer;
    const request=async()=>{
      let response;
      try{response=await this.fetch(this.config.baseURL+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.#key}`},body:JSON.stringify({model:this.config.model,temperature:this.config.temperature,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(context)}],max_tokens:6000}),signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer'});}catch{throw new Error('無法連線。請確認網路、HTTPS、Provider 的 CORS 或使用自己的 Proxy。');}
      if(!response.ok)throw new Error(response.status===429?'Provider 額度不足或請求過於頻繁（429）':response.status===401||response.status===403?'API Key／Proxy Token 無效或沒有模型權限':`Provider 請求失敗（HTTP ${response.status}）`);
      let body;try{body=await response.json();}catch{throw new Error('Provider 回傳無效 JSON');}
      const choice=body?.choices?.[0];if(choice?.finish_reason && choice.finish_reason!=='stop')throw new Error('AI 回應未完整生成，請重新生成');
      const content=choice?.message?.content;if(typeof content!=='string'||content.length>60000)throw new Error('AI 回應為空或過長');
      try{return JSON.parse(content);}catch{throw new Error('AI 回傳 malformed JSON，尚未變更存檔');}
    };
    try{return await Promise.race([request(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('AI 請求逾時，尚未變更存檔'));},this.timeoutMs);})]);}finally{clearTimeout(timer);controller.abort();}
  }
  async testConnection(){const result=await this.generateScene({system:'Return JSON only: {"ok":true}. This is a connection test.',context:{test:true}});if(result?.ok!==true)throw new Error('模型未通過 JSON 連線測試');return true;}
}
