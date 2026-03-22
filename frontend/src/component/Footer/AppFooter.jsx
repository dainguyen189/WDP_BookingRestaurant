import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faPhone,
  faClock,
  faLocationDot,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import './AppFooter.css';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__brand">
          <span className="app-footer__logo">
            <FontAwesomeIcon icon={faUtensils} aria-hidden />
            <span>Restaurant Booking</span>
          </span>
          <p className="app-footer__tagline">
            Đặt bàn trực tuyến — trải nghiệm ẩm thực gọn gàng, nhanh chóng.
          </p>
        </div>

        <nav className="app-footer__nav" aria-label="Liên kết nhanh">
          <h2 className="app-footer__heading">Liên kết</h2>
          <ul>
            <li>
              <Link to="/home">Trang chủ</Link>
            </li>
            <li>
              <Link to="/view-menu">Thực đơn</Link>
            </li>
            <li>
              <Link to="/booking">Đặt bàn</Link>
            </li>
            <li>
              <Link to="/aboutus">Giới thiệu</Link>
            </li>
          </ul>
        </nav>

        <div className="app-footer__contact">
          <h2 className="app-footer__heading">Liên hệ</h2>
          <ul className="app-footer__contact-list">
            <li>
              <FontAwesomeIcon icon={faLocationDot} className="app-footer__icon" aria-hidden />
              <span>TP. Hồ Chí Minh, Việt Nam</span>
            </li>
            <li>
              <FontAwesomeIcon icon={faPhone} className="app-footer__icon" aria-hidden />
              <a href="tel:02838221234">028 3822 1234</a>
            </li>
            <li>
              <FontAwesomeIcon icon={faEnvelope} className="app-footer__icon" aria-hidden />
              <a href="mailto:contact@restaurant.local">contact@restaurant.local</a>
            </li>
            <li>
              <FontAwesomeIcon icon={faClock} className="app-footer__icon" aria-hidden />
              <span>09:00 – 22:00 hằng ngày</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="app-footer__bottom">
        <p>© {year} Restaurant Booking. Phục vụ tận tâm.</p>
      </div>
    </footer>
  );
}
