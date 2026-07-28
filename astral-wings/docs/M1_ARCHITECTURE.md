# M1 architecture boundary

M1 keeps the proven Canvas gameplay intact while separating responsibilities:

- `js/services/saveService.js`: the only persistence entry point for new UI code. It delegates to existing migration logic, so legacy `astralWingsSaveV1` fields remain intact.
- `js/core/router.js`: owns screen selection and DOM replacement for Home, Battle Ready, menus and battle.
- `js/core/store.js`: observable, non-persistent UI state (`screen` and Battle Ready payload).
- `js/battle/battleEngine.js`: lifecycle adapter for the existing `game.js` requestAnimationFrame loop; exposes `pause`, `ultimate`, `claim`, `stop` and a diagnostics snapshot.
- Existing fixed content remains data-driven in `js/data/*.js`; combat tuning remains centralized in `js/config.js`.

`?debug=1` (or `#debug`) displays the opt-in diagnostic overlay. It is excluded from normal player UI and does not write save data.
