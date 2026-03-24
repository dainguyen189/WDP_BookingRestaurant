/**
 * Hiển thị thời gian chờ bếp (phút từ API) dạng dễ đọc.
 */
export function formatWaitingDisplay(minutes) {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  if (m < 1) return "Vừa đặt";
  if (m < 60) return `${m} phút`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h} giờ ${rem} phút` : `${h} giờ`;
  }
  const d = Math.floor(m / 1440);
  const remM = m % 1440;
  const h = Math.floor(remM / 60);
  return h ? `${d} ngày ${h} giờ` : `${d} ngày`;
}

/** Class badge: normal / warning / urgent — đồng bộ ChefOrder + OrderCard */
export function waitingTimeClass(minutes) {
  const m = Math.max(0, Number(minutes) || 0);
  if (m >= 24 * 60) return "urgent";
  if (m > 30) return "urgent";
  if (m > 15) return "warning";
  return "normal";
}
