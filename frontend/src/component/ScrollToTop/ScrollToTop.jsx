import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Cuộn lên đầu trang mỗi khi đổi route (UX chuẩn SPA).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
