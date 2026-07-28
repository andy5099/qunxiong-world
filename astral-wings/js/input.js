/**
 * One scoped input controller per battle canvas.  Every listener is removed by
 * destroy(), so replaying stages never accumulates keyboard or pointer handlers.
 */
export function input(canvas) {
  const state = { x: 180, y: 555, drag: false, pointerId: null, keys: {} };
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const toGamePoint = event => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * 360 / Math.max(1, rect.width),
      y: (event.clientY - rect.top) * 640 / Math.max(1, rect.height)
    };
  };
  const release = event => {
    if (state.pointerId !== null && (!event || event.pointerId === state.pointerId)) {
      try { if (canvas.hasPointerCapture?.(state.pointerId)) canvas.releasePointerCapture(state.pointerId); } catch {}
      state.drag = false;
      state.pointerId = null;
    }
  };
  canvas.addEventListener('pointerdown', event => {
    if (state.pointerId !== null || !event.isPrimary) return;
    state.pointerId = event.pointerId;
    state.drag = true;
    try { canvas.setPointerCapture(event.pointerId); } catch {}
    Object.assign(state, toGamePoint(event));
    event.preventDefault();
  }, options);
  canvas.addEventListener('pointermove', event => {
    if (!state.drag || event.pointerId !== state.pointerId) return;
    Object.assign(state, toGamePoint(event));
    event.preventDefault();
  }, options);
  canvas.addEventListener('pointerup', release, options);
  canvas.addEventListener('pointercancel', release, options);
  window.addEventListener('pointerup', release, options);
  window.addEventListener('blur', () => { state.drag = false; state.pointerId = null; }, options);
  window.addEventListener('keydown', event => { state.keys[event.key.toLowerCase()] = true; }, options);
  window.addEventListener('keyup', event => { state.keys[event.key.toLowerCase()] = false; }, options);
  state.destroy = () => controller.abort();
  return state;
}
