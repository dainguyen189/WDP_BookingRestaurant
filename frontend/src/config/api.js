/**
 * Base URL backend — override bằng REACT_APP_API_URL trong .env (không có dấu / cuối).
 */
const raw =
  (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) ||
  'http://localhost:8080';

export const API_BASE_URL = String(raw).replace(/\/$/, '');
export const API_URL = `${API_BASE_URL}/api`;
