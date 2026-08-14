import { FORMATION_ORBS, swapBoardCells } from './formation-puzzle.js?v=v021-boss-puzzle';

let countdown = null;
export function unmountFormationPuzzle() { if (countdown !== null) clearInterval(countdown); countdown = null; }

function paint(board, root) {
  root.querySelectorAll('[data-orb-index]').forEach((node, i) => {
    const cell = board[i], info = FORMATION_ORBS[cell.type];
    node.className = `formation-orb orb-${cell.type}${cell.locked ? ' locked' : ''}${cell.burning ? ' burning' : ''}`;
    node.firstElementChild.textContent = info.icon; node.setAttribute('aria-label', `${info.name}${cell.locked ? '，鎖定' : ''}`);
  });
}

export function mountFormationPuzzle(root, battle, onSettle) {
  unmountFormationPuzzle();
  const boardNode = root.querySelector('.formation-puzzle-board'), clock = root.querySelector('.formation-time');
  if (!boardNode || !battle?.formation?.active) return;
  let dragging = false, current = -1, deadline = 0, settled = false;
  const finish = () => { if (settled) return; settled = true; unmountFormationPuzzle(); onSettle(); };
  const tick = () => { const left = Math.max(0, deadline - Date.now()); if (clock) clock.textContent = (left / 1000).toFixed(1); if (!left) finish(); };
  boardNode.addEventListener('pointerdown', event => {
    const orb = event.target.closest('[data-orb-index]'); if (!orb) return;
    const at = Number(orb.dataset.orbIndex); if (battle.formation.board[at]?.locked) return;
    event.preventDefault(); dragging = true; current = at; deadline = Date.now() + 6000; boardNode.setPointerCapture(event.pointerId);
    countdown = setInterval(tick, 80); tick();
  });
  boardNode.addEventListener('pointermove', event => {
    if (!dragging) return; event.preventDefault();
    const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-orb-index]'); if (!hit) return;
    const next = Number(hit.dataset.orbIndex); if (next !== current && swapBoardCells(battle.formation.board, current, next)) { current = next; paint(battle.formation.board, boardNode); }
  });
  const release = event => { if (!dragging) return; dragging = false; try { boardNode.releasePointerCapture(event.pointerId); } catch {} finish(); };
  boardNode.addEventListener('pointerup', release); boardNode.addEventListener('pointercancel', release);
}
