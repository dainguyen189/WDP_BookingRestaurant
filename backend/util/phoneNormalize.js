/**
 * Chuẩn hóa SĐT Việt Nam -> dạng 84xxxxxxxxx (không có dấu +),
 * dùng cho eSMS và khóa cache OTP (phải giống lúc gửi và lúc xác thực).
 */
function normalizeVietnamPhone(input) {
  if (input == null || typeof input !== "string") return null;
  let d = input.trim().replace(/[\s\-().]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (!d) return null;

  // 84 + mạng di động VN (3,5,7,8,9) + 8 chữ số = 11 ký tự
  if (/^84[35789][0-9]{8}$/.test(d)) {
    return d;
  }

  // Một số số dài hơn (11 chữ số sau 84)
  if (/^84[35789][0-9]{9}$/.test(d)) {
    return d;
  }

  // 0xxxxxxxxx (10 số)
  if (/^0[35789][0-9]{8}$/.test(d)) {
    return `84${d.slice(1)}`;
  }

  // Bỏ số 0 đầu: 9xxxxxxxxx (9 số)
  if (/^[35789][0-9]{8}$/.test(d)) {
    return `84${d}`;
  }

  return null;
}

module.exports = { normalizeVietnamPhone };
