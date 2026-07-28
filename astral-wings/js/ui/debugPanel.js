/** Lightweight, opt-in runtime diagnostics. Enable only with ?debug=1 or #debug. */
export function mountDebugPanel({ getScreen, getData, getBattle }) {
  const enabled = new URLSearchParams(location.search).get('debug') === '1' || location.hash.includes('debug');
  if (!enabled) return () => {};
  const panel = document.createElement('aside');
  panel.className = 'debug-panel';
  panel.setAttribute('aria-live', 'polite');
  document.body.append(panel);
  const render = () => {
    const screen = getScreen();
    const data = getData();
    const battle = getBattle()?.snapshot?.() || {};
    panel.textContent = `DEBUG\nscreen: ${screen.name}\nship: ${data.activeShip}\ngold: ${data.gold}\nbattle: ${battle.running ? 'running' : 'idle'}${battle.paused ? ' / paused' : ''}\nobjects: ${battle.enemies || 0}E ${battle.bullets || 0}B ${battle.pickups || 0}P`;
  };
  render();
  const timer = window.setInterval(render, 250);
  return () => { window.clearInterval(timer); panel.remove(); };
}
