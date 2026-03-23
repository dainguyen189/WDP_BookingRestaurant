import React, { useState, useEffect } from 'react';
import {
  Container, Form, Button, Row, Col, Alert, Modal
} from 'react-bootstrap';
import Header from '../../Header/Header';
import './css/Reservation.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import DishSelectionModal from './DishSelectionModal';

function Reservation() {
  const [showDishModal, setShowDishModal] = useState(false); const [showOtpModal, setShowOtpModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [menuItems, setMenuItems] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    reservationDate: '',
    reservationTime: '',
    guestCount: 1,
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const [otpTarget, setOtpTarget] = useState('phone');
  const [otpSent, setOtpSent] = useState(false);
  const [inputOtp, setInputOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));

        if (!storedUser || !storedUser._id) {
          console.log('User information not found');
        }

        const token = localStorage.getItem('token');

        const response = await axios.get(`http://localhost:8080/api/user/${storedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        console.log(response.data)

        setFormData(prev => ({
          ...prev,
          email: response.data.email || '',
          phone: response.data.phone || '',
        }));

      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile()

    fetch('http://localhost:8080/api/menu-items?needPreOrder=true')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error('Error fetching menu items:', err));

  }, []);
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);
  useEffect(() => {
    if (showOtpModal) {
      if (formData.email) {
        setOtpTarget('email');
      } else if (formData.phone) {
        setOtpTarget('phone');
      }
    }
  }, [showOtpModal]);

  const validate = () => {
    const errs = {};
    const phoneRegex = /^0(3|5|7|8|9)[0-9]{8,9}$/;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!formData.phone && !formData.email) errs.contact = 'Cần cung cấp số điện thoại hoặc email';
    if (formData.phone && !phoneRegex.test(formData.phone)) errs.phone = 'Số điện thoại không hợp lệ';
    if (!formData.name.trim()) errs.name = 'Tên là bắt buộc';

    if (!formData.reservationDate) {
      errs.reservationDate = 'Ngày là bắt buộc';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.reservationDate);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errs.reservationDate = 'Ngày không hợp lệ';
      }
    }

    if (!timeRegex.test(formData.reservationTime)) {
      errs.reservationTime = 'Giờ không hợp lệ (HH:mm)';
    } else {
      const [hours, minutes] = formData.reservationTime.split(':').map(Number);

      // Enforce 9AM to 9PM time slot
      if (hours < 9 || (hours === 21 && minutes > 0) || hours > 21) {
        errs.reservationTime = 'Giờ chỉ được phép từ 09:00 đến 21:00';
      } else {
        const selectedDate = new Date(formData.reservationDate);
        const reservationDateTime = new Date(selectedDate);
        reservationDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        const requiredTime = 3
        const fiveHoursLater = new Date(now.getTime() + requiredTime * 60 * 60 * 1000);

        // If selected date is today, check the time rule
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate.getTime() === today.getTime()) {
          if (reservationDateTime < fiveHoursLater) {
            errs.reservationTime = `Thời gian phải ít nhất ${requiredTime} tiếng kể từ bây giờ`;
          }
        }
      }
    }

    if (formData.guestCount < 1) errs.guestCount = 'Tối thiểu 1 khách';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);

    if (!validate()) return;
    setShowOtpModal(true);
  };

  const sendOtp = async () => {
    const target = otpTarget === 'phone' ? formData.phone.trim() : formData.email.trim();
    if (!target) {
      setOtpStatus(`Thiếu ${otpTarget === 'phone' ? 'số điện thoại' : 'email'}`);
      return;
    }
    setOtpStatus('Đang gửi...');

    const payload = otpTarget === 'phone' ? { phone: target } : { email: target };

    try {
      const res = await fetch(`http://localhost:8080/api/reservation/otp/${otpTarget}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setOtpStatus(data.message || `OTP đã gửi qua ${otpTarget === 'phone' ? 'số điện thoại' : 'email'}`);
        setOtpSent(true);
        setResendTimer(60);
      } else {
        const data = await res.json();
        setOtpStatus(data.message || 'Lỗi khi gửi OTP');
      }
    } catch (error) {
      setOtpStatus('Lỗi kết nối tới máy chủ');
    }
  };

  const confirmOtpAndSubmit = async () => {
    // Validate OTP format
    if (!inputOtp || !/^\d{6}$/.test(inputOtp)) {
      toast.error('Mã OTP phải có 6 chữ số');
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('user'));
    console.log(formData)

    try {
      const res = await fetch('http://localhost:8080/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          phone: formData.phone || null,
          email: formData.email || null,
          preOrders: selectedDishes,
          otp: inputOtp,
          otpTarget: otpTarget,
          accountId: storedUser?._id || null
        }),
      });

      const data = await res.json();

      if (res.ok) {
        //setSuccess('Đặt bàn thành công!');
        toast.success("Đặt bàn thành công!");
        setFormData({ phone: storedUser?.phone ?? '', name: '', reservationDate: '', reservationTime: '', guestCount: 1, email: storedUser?.email ?? '' });
        setSelectedDishes([]);
        setErrors({});
        setShowOtpModal(false);
        setOtpSent(false);
        setInputOtp('');
        setOtpStatus('');
      } else {
        //setOtpStatus(data.message || 'OTP sai hoặc có lỗi');
        toast.error(data.message || 'OTP sai hoặc có lỗi');
      }
    } catch (err) {
      //setOtpStatus(err.message || 'Lỗi gửi yêu cầu');
      toast.error('Lỗi gửi yêu cầu');
    }
  };

  return (
    <>
      <Header />
      <div className="booking-page-shell">
      <Container className="py-4 mb-0 booking-form-container booking-form-container--narrow">
        <h3 className="booking-page-title mb-2 text-center">Đặt bàn</h3>
        <p className="booking-page-subtitle text-center text-muted mb-4">
          Điền thông tin bên dưới để giữ chỗ tại nhà hàng
        </p>

        {success && <Alert variant="success">{success}</Alert>}
        {errors.api && <Alert variant="danger">{errors.api}</Alert>}

        <Form onSubmit={handleSubmit} className="booking-form-card">
          <Row className="g-3 mb-1">
            <Col md={6}>
              <Form.Group controlId="bookingName">
                <Form.Label className="booking-field-label">
                  Tên khách hàng <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  isInvalid={!!errors.name}
                  onChange={handleChange}
                  placeholder="Nhập họ tên"
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="bookingGuests">
                <Form.Label className="booking-field-label">
                  Số lượng khách <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  name="guestCount"
                  min="1"
                  value={formData.guestCount}
                  isInvalid={!!errors.guestCount}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">{errors.guestCount}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-1">
            <Col md={6}>
              <Form.Group controlId="bookingDate">
                <Form.Label className="booking-field-label">
                  Ngày đặt bàn <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="reservationDate"
                  value={formData.reservationDate}
                  isInvalid={!!errors.reservationDate}
                  onChange={handleChange}
                />
                <Form.Control.Feedback type="invalid">{errors.reservationDate}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="bookingTime">
                <Form.Label className="booking-field-label">
                  Giờ đặt bàn <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="time"
                  name="reservationTime"
                  value={formData.reservationTime}
                  isInvalid={!!errors.reservationTime}
                  onChange={handleChange}
                  lang="en-GB"
                />
                <Form.Control.Feedback type="invalid">{errors.reservationTime}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <div className="booking-section-divider mt-4 mb-3">
            <hr className="flex-grow-1" />
            <span>
              Email hoặc số điện thoại <span className="text-danger">*</span>
            </span>
            <hr className="flex-grow-1" />
          </div>

          {errors.contact && (
            <div className="text-center text-danger small mb-3">{errors.contact}</div>
          )}

          <Row className="g-3 mb-2">
            <Col md={6}>
              <Form.Group controlId="bookingPhone">
                <Form.Label className="booking-field-label">Số điện thoại</Form.Label>
                <Form.Control
                  type="tel"
                  inputMode="numeric"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  isInvalid={!!errors.phone}
                  onChange={handleChange}
                  placeholder="Ví dụ: 0912345678"
                />
                <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="bookingEmail">
                <Form.Label className="booking-field-label">Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="booking-actions d-flex flex-wrap gap-3 justify-content-center align-items-center mt-4 pt-3">
            <Button
              type="button"
              variant="outline-success"
              className="btn-booking-outline"
              onClick={() => setShowDishModal(true)}
            >
              Chọn món đặt trước
            </Button>
            <Button type="submit" variant="success" className="btn-booking-primary" size="lg">
              Đặt bàn
            </Button>
          </div>
        </Form>
      </Container>
      </div>

      {/* /OTP MODAL/ */}
      <Modal show={showOtpModal} onHide={() => setShowOtpModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác thực OTP</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Gửi OTP qua:</Form.Label>
              <Form.Select value={otpTarget} onChange={e => { setOtpTarget(e.target.value); setOtpSent(false); setInputOtp(''); setOtpStatus(''); }}>
                {formData.email && <option value="email">Email</option>}
                {formData.phone && <option value="phone">Số điện thoại</option>}
              </Form.Select>
            </Form.Group>

            <Button
              variant="primary"
              className="mb-3"
              onClick={sendOtp}
              disabled={resendTimer > 0}
            >
              {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : 'Gửi OTP'}
            </Button>
            {otpSent && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Nhập mã OTP (6 chữ số):</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={inputOtp} 
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setInputOtp(value);
                    }}
                    placeholder="Nhập 6 chữ số"
                    maxLength={6}
                  />
                </Form.Group>
                <Button onClick={confirmOtpAndSubmit} variant="success">Xác thực & Đặt bàn</Button>
              </>
            )}

            {otpStatus && <Alert variant="info" className="mt-3">{otpStatus}</Alert>}
          </Form>
        </Modal.Body>
      </Modal>
      <DishSelectionModal
        show={showDishModal}
        onHide={() => setShowDishModal(false)}
        menuItems={menuItems}
        selectedDishes={selectedDishes}
        setSelectedDishes={setSelectedDishes}
      />
      <div>
        <ToastContainer />
      </div>
    </>
  );
}

export default Reservation;
