export const VISUAL_THEME = Object.freeze({
  ink: '#080d25', panel: '#111a3b', panelLight: '#1d2b58', gold: '#f6cf72',
  goldDark: '#9b642a', cyan: '#73e6ff', violet: '#aa87ff', danger: '#ff647d',
  success: '#71efbb', text: '#f4f7ff', muted: '#9baad0', radius: 14,
  maps: {
    1: { sky: ['#173875','#77bce8'], terrain: ['#327357','#163d40'], accent: '#ffe27c' },
    2: { sky: ['#071d32','#174d51'], terrain: ['#143d33','#071d25'], accent: '#79ffc8' },
    3: { sky: ['#32152d','#b04632'], terrain: ['#4d211c','#160d1c'], accent: '#ffb052' },
    4: { sky: ['#14325c','#8fc9e9'], terrain: ['#35677d','#142b4e'], accent: '#d9fbff' },
    5: { sky: ['#15103f','#482b78'], terrain: ['#2d245c','#0b0b29'], accent: '#d09bff' },
  },
});

export function visualMapTheme(id) { return VISUAL_THEME.maps[id] || VISUAL_THEME.maps[1]; }
