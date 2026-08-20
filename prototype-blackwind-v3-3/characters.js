export const CHARACTERS={
 guan:{name:'關羽',color:'#4dffc0',passive:'武聖',skill:'青龍偃月',ultimate:'武聖・青龍滅陣',synergy:'弱點追斬',motion:'slash',role:'弱點爆發'},
 zhangfei:{name:'張飛',color:'#ff765e',passive:'豪膽',skill:'震軍破陣',ultimate:'萬軍俱裂',synergy:'破陣震波',motion:'smash',role:'BREAK重擊'},
 liubei:{name:'劉備',color:'#f5d66d',passive:'仁德',skill:'仁德軍陣',ultimate:'昭烈・天下歸心',synergy:'仁德續戰',motion:'support',role:'治療循環'},
 blackwind:{name:'黑風寨主',color:'#a68cff',passive:'黑風追擊',skill:'黑風亂舞',ultimate:'黑風霸天',synergy:'撞牆回攻',motion:'ricochet',role:'牆壁Combo'},
 tiger:{name:'赤焰魔虎',color:'#ff713d',passive:'赤焰本能',skill:'焚天狂襲',ultimate:'焚天滅世',synergy:'狂焰續衝',motion:'burn',role:'燃燒持續'},
 thunder:{name:'九幽雷獸',color:'#65d9ff',passive:'雷影',skill:'雷影穿界',ultimate:'九幽天罰',synergy:'雷光穿透',motion:'pierce',role:'高速多Hit'},
 zhangbao:{name:'張寶',color:'#bd83ff',passive:'雷引',skill:'黃天雷陣',ultimate:'蒼天已死・黃天神雷',synergy:'撞牆蓄雷',motion:'storm',role:'蓄雷爆發'},
 captain:{name:'黃巾校尉',color:'#d8c58d',passive:'重甲',skill:'鐵壁軍陣',ultimate:'黃巾鐵陣',synergy:'霸體減傷',motion:'guard',role:'防禦反擊'},
 commander:{name:'黃巾渠帥',color:'#ff9b66',passive:'乘勝',skill:'破軍追殺',ultimate:'黃天絕殺',synergy:'殘血強擊',motion:'hunt',role:'殘血追殺'},
 hero:{name:'主角',color:'#75baff',passive:'奮戰',skill:'龍膽突擊',ultimate:'龍騰破軍',synergy:'Perfect協擊',motion:'charge',role:'操作獎勵'}
};
export const PRESETS={burst:{name:'爆發隊',team:['guan','zhangfei','hero']},sustain:{name:'持續隊',team:['tiger','thunder','liubei']},combo:{name:'Combo隊',team:['blackwind','zhangbao','guan']},counter:{name:'反擊隊',team:['captain','hero','liubei']}};
