const FILES=['monsters','items','skills','heroes','maps','quests','bosses','achievements','formations','daily-quests','events','artifacts','dungeons','hunt-maps','hunt-monsters','hunt-bosses','affixes'];
export async function loadGameData(){
  const entries=await Promise.all(FILES.map(async name=>{
    const response=await fetch(`./data/${name}.json`);
    if(!response.ok) throw new Error(`無法讀取 ${name}.json`);
    return [name.replace('-',''),await response.json()];
  }));
  return Object.fromEntries(entries);
}
export const byId=(list,id)=>list.find(entry=>entry.id===id);
