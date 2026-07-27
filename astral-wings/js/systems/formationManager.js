// 關卡波次的資料驅動編隊：成員先維持共同航線，再在時間到後交給個別 AI。
export const createFormation = (type, count, startedAt = 0) => ({
  type, count, startedAt, hold: 1.7, fireAt: 1.05, retreatAt: 3.4,
  point(index, elapsed) {
    const center = (count - 1) / 2;
    const slot = index - center;
    const enter = Math.min(1, elapsed / 0.85);
    const baseY = -42 + enter * 178;
    if (type === 'vee') return { x: 180 + slot * 33, y: baseY - Math.abs(slot) * 17 };
    if (type === 'column') return { x: 180, y: baseY - index * 34 };
    if (type === 'row') return { x: 180 + slot * 42, y: baseY };
    if (type === 'cross') return { x: 180 + (index % 2 ? -1 : 1) * (34 + Math.floor(index / 2) * 29), y: baseY - Math.floor(index / 2) * 21 };
    if (type === 'pincer') return { x: (index % 2 ? 55 : 305) + (index % 2 ? 1 : -1) * Math.min(72, elapsed * 50), y: baseY - Math.floor(index / 2) * 19 };
    if (type === 'wave') return { x: 48 + index * (264 / Math.max(1, count - 1)), y: baseY + Math.sin(elapsed * 3 + index * 0.9) * 22 };
    if (type === 'spiral') return { x: 180 + Math.sin(elapsed * 2.5 + index * 1.55) * (30 + index * 8), y: baseY - index * 12 };
    return { x: index % 2 ? 45 : 315, y: baseY - Math.floor(index / 2) * 24 };
  }
});
