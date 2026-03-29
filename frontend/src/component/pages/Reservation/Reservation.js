import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Modal,
} from "react-bootstrap";
import Header from "../../Header/Header";
import "./css/Reservation.css";
import axios from "axios";
import { toast } from "react-toastify";
import DishSelectionModal from "./DishSelectionModal";

function readStoredUsername() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const u = JSON.parse(raw);
    const s = u?.username ?? u?.name;
    return typeof s === "string" ? s.trim() : "";
  } catch {
    return "";
  }
}

function Reservation() {
  const [showDishModal, setShowDishModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [menuItems, setMenuItems] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [formData, setFormData] = useState({
    phone: "",
    name: readStoredUsername(),
    reservationDate: "",
    reservationTime: "",
    guestCount: 1,
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const [otpTarget, setOtpTarget] = useState("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [inputOtp, setInputOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const raw = localStorage.getItem("user");
        const storedUser = raw ? JSON.parse(raw) : null;

        if (!storedUser?._id) {
          return;
        }

        const token = localStorage.getItem("token");

        const response = await axios.get(
          `http://localhost:8080/api/user/${storedUser._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          },
        );

        const profile = response.data;
        const profileName =
          (profile.username && String(profile.username).trim()) ||
          (profile.name && String(profile.name).trim()) ||
          "";
        setFormData((prev) => ({
          ...prev,
          email: profile.email || prev.email || "",
          phone: profile.phone || prev.phone || "",
          name: prev.name.trim() || profileName || prev.name,
        }));
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchUserProfile();

    fetch("http://localhost:8080/api/menu-items?needPreOrder=true")
      .then((res) => res.json())
      .then((data) => setMenuItems(data))
      .catch((err) => console.error("Error fetching menu items:", err));
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
        setOtpTarget("email");
      } else if (formData.phone) {
        setOtpTarget("phone");
      }
    }
  }, [showOtpModal]);

  const parseLocalYmd = (dateStr) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const validate = () => {
    const errs = {};
    const phoneRegex = /^0(3|5|7|8|9)[0-9]{8,9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!formData.phone && !formData.email)
      errs.contact = "Cần cung cấp số điện thoại hoặc email";
    if (formData.phone && !phoneRegex.test(formData.phone))
      errs.phone = "Số điện thoại không hợp lệ (phải bắt đầu bằng 0, đủ 10 số)";
    if (formData.email && !emailRegex.test(formData.email))
      errs.email = "Email không hợp lệ";
    const resolvedName = formData.name.trim() || readStoredUsername();
    if (!resolvedName) errs.name = "Tên là bắt buộc";

    if (!formData.reservationDate) {
      errs.reservationDate = "Ngày là bắt buộc";
    } else {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const selectedDay = parseLocalYmd(formData.reservationDate);
      if (!selectedDay) {
        errs.reservationDate = "Ngày không hợp lệ";
      } else {
        selectedDay.setHours(0, 0, 0, 0);
        if (selectedDay < todayStart) {
          errs.reservationDate = "Ngày không hợp lệ";
        }
      }
    }

    const timeStr = (formData.reservationTime || "").trim();
    if (!timeStr) {
      errs.reservationTime = "Vui lòng chọn giờ đặt bàn";
    } else if (!timeRegex.test(timeStr)) {
      errs.reservationTime = "Giờ không hợp lệ (HH:mm)";
    } else {
      const [hs, ms] = timeStr.split(":");
      const hours = Number(hs);
      const minutes = Number(ms);

      if (hours < 9 || (hours === 21 && minutes > 0) || hours > 21) {
        errs.reservationTime = "Giờ chỉ được phép từ 09:00 đến 21:00";
      } else {
        const requiredHoursAhead = 3;
        const reservationDateTime = parseLocalYmd(formData.reservationDate);
        if (reservationDateTime) {
          reservationDateTime.setHours(hours, minutes, 0, 0);
          const now = new Date();
          const minBookingTime = new Date(
            now.getTime() + requiredHoursAhead * 60 * 60 * 1000,
          );

          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const selDay = parseLocalYmd(formData.reservationDate);
          if (selDay) {
            selDay.setHours(0, 0, 0, 0);
            if (selDay.getTime() === todayStart.getTime()) {
              if (reservationDateTime < minBookingTime) {
                errs.reservationTime = `Thời gian phải ít nhất ${requiredHoursAhead} tiếng kể từ bây giờ`;
              }
            }
          }
        }
      }
    }

    if (formData.guestCount < 1) errs.guestCount = "Tối thiểu 1 khách";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const pad2 = (n) => String(Number(n)).padStart(2, "0");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const bookingHours24 = Array.from({ length: 13 }, (_, i) => pad2(i + 9));

  const timeParts = formData.reservationTime.split(":");
  const resH = timeParts[0] || "";
  const resM = timeParts[1] || "";
  const bookingMinutes =
    resH === "21" ? ["00"] : Array.from({ length: 60 }, (_, i) => pad2(i));

  const clearReservationTimeError = () => {
    setErrors((prev) => {
      if (!prev.reservationTime) return prev;
      const next = { ...prev };
      delete next.reservationTime;
      return next;
    });
  };

  const handleBookingHourChange = (e) => {
    const hour = e.target.value;
    clearReservationTimeError();
    if (!hour) {
      setFormData((prev) => ({ ...prev, reservationTime: "" }));
      return;
    }
    const prevMin = formData.reservationTime.split(":")[1];
    const minute =
      hour === "21"
        ? "00"
        : prevMin && /^[0-5]\d$/.test(prevMin)
          ? prevMin
          : "00";
    setFormData((prev) => ({ ...prev, reservationTime: `${hour}:${minute}` }));
  };

  const handleBookingMinuteChange = (e) => {
    const minute = e.target.value;
    const hour = formData.reservationTime.split(":")[0];
    if (!hour) return;
    clearReservationTimeError();
    if (!minute) {
      setFormData((prev) => ({ ...prev, reservationTime: `${hour}:00` }));
      return;
    }
    setFormData((prev) => ({ ...prev, reservationTime: `${hour}:${minute}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);

    if (!validate()) return;
    setShowOtpModal(true);
  };

  const sendOtp = async () => {
    const target =
      otpTarget === "phone" ? formData.phone.trim() : formData.email.trim();
    if (!target) {
      setOtpStatus(
        `Thiếu ${otpTarget === "phone" ? "số điện thoại" : "email"}`,
      );
      return;
    }
    setOtpStatus("Đang gửi...");

    const payload =
      otpTarget === "phone" ? { phone: target } : { email: target };

    try {
      const res = await fetch(
        `http://localhost:8080/api/reservation/otp/${otpTarget}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const data = await res.json();
        setOtpStatus(
          data.message ||
            `OTP đã gửi qua ${otpTarget === "phone" ? "số điện thoại" : "email"}`,
        );
        setOtpSent(true);
        setResendTimer(60);
      } else {
        let data = {};
        try {
          data = await res.json();
        } catch {
          /* ignore */
        }
        const firstErr = Array.isArray(data.errors) ? data.errors[0] : null;
        setOtpStatus(
          data.message ||
            firstErr?.msg ||
            firstErr?.message ||
            "Lỗi khi gửi OTP",
        );
      }
    } catch (error) {
      setOtpStatus("Lỗi kết nối tới máy chủ");
    }
  };

  const confirmOtpAndSubmit = async () => {
    // Validate OTP format
    if (!inputOtp || !/^\d{6}$/.test(inputOtp)) {
      toast.error("Mã OTP phải có 6 chữ số");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const nameForApi = formData.name.trim() || readStoredUsername() || "";

    try {
      const res = await fetch("http://localhost:8080/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          name: nameForApi,
          phone: formData.phone || null,
          email: formData.email || null,
          preOrders: selectedDishes,
          otp: inputOtp,
          otpTarget: otpTarget,
          accountId: storedUser?._id || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        //setSuccess('Đặt bàn thành công!');
        toast.success("Đặt bàn thành công!");
        setFormData({
          phone: storedUser?.phone ?? "",
          name: readStoredUsername(),
          reservationDate: "",
          reservationTime: "",
          guestCount: 1,
          email: storedUser?.email ?? "",
        });
        setSelectedDishes([]);
        setErrors({});
        setShowOtpModal(false);
        setOtpSent(false);
        setInputOtp("");
        setOtpStatus("");
      } else {
        //setOtpStatus(data.message || 'OTP sai hoặc có lỗi');
        toast.error(data.message || "OTP sai hoặc có lỗi");
      }
    } catch (err) {
      //setOtpStatus(err.message || 'Lỗi gửi yêu cầu');
      toast.error("Lỗi gửi yêu cầu");
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
              <Col xs={12}>
                <Form.Group controlId="bookingName">
                  <Form.Label className="booking-field-label">
                    Tên khách hàng <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    id="bookingName"
                    autoComplete="name"
                    className="booking-input-customer-name"
                    value={formData.name}
                    isInvalid={!!errors.name}
                    onChange={handleChange}
                    placeholder="Nhập họ tên"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-1">
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
                  <Form.Control.Feedback type="invalid">
                    {errors.guestCount}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

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
                  <Form.Control.Feedback type="invalid">
                    {errors.reservationDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-1">
              <Col md={6}>
                <Form.Group controlId="bookingTime">
                  <Form.Label className="booking-field-label">
                    Giờ đặt bàn <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="booking-time-24h">
                    <Form.Select
                      aria-label="Giờ theo định dạng 24h (09–21)"
                      value={resH}
                      onChange={handleBookingHourChange}
                      isInvalid={!!errors.reservationTime}
                    >
                      <option value="">— Giờ —</option>
                      {bookingHours24.map((h) => (
                        <option key={h} value={h}>
                          {h} giờ
                        </option>
                      ))}
                    </Form.Select>
                    <span className="booking-time-sep" aria-hidden>
                      :
                    </span>
                    <Form.Select
                      aria-label="Phút"
                      value={resH ? resM : ""}
                      onChange={handleBookingMinuteChange}
                      disabled={!resH}
                      isInvalid={!!errors.reservationTime}
                    >
                      <option value="">— Phút —</option>
                      {bookingMinutes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  {errors.reservationTime ? (
                    <div className="text-danger small mt-1">
                      {errors.reservationTime}
                    </div>
                  ) : null}
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
              <div className="text-center text-danger small mb-3">
                {errors.contact}
              </div>
            )}

            <Row className="g-3 mb-2">
              <Col md={6}>
                <Form.Group controlId="bookingPhone">
                  <Form.Label className="booking-field-label">
                    Số điện thoại
                  </Form.Label>
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
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="bookingEmail">
                  <Form.Label className="booking-field-label">Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    isInvalid={!!errors.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
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
              <Button
                type="submit"
                variant="success"
                className="btn-booking-primary"
                size="lg"
              >
                Đặt bàn
              </Button>
            </div>
          </Form>
        </Container>
      </div>

      {/* /OTP MODAL/ — không dùng Form lồng để tránh lỗi hiển thị ô OTP */}
      <Modal
        show={showOtpModal}
        onHide={() => setShowOtpModal(false)}
        centered
        size="md"
        className="booking-otp-modal"
        contentClassName="booking-otp-modal-content"
        dialogClassName="booking-otp-modal-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác thực OTP</Modal.Title>
        </Modal.Header>
        <Modal.Body className="booking-otp-modal-body">
          <div className="mb-3">
            <label className="form-label" htmlFor="bookingOtpChannel">
              Gửi OTP qua:
            </label>
            <select
              id="bookingOtpChannel"
              className="form-select"
              value={otpTarget}
              onChange={(e) => {
                setOtpTarget(e.target.value);
                setOtpSent(false);
                setInputOtp("");
                setOtpStatus("");
              }}
            >
              {formData.email && <option value="email">Email</option>}
              {formData.phone && <option value="phone">Số điện thoại</option>}
            </select>
          </div>

          <Button
            type="button"
            variant="primary"
            className="mb-3 w-100"
            onClick={sendOtp}
            disabled={resendTimer > 0}
          >
            {resendTimer > 0 ? `Gửi lại sau ${resendTimer}s` : "Gửi OTP"}
          </Button>

          {otpSent ? (
            <div className="booking-otp-input-block">
              <label className="form-label" htmlFor="bookingOtpCode">
                Nhập mã OTP (6 chữ số):
              </label>
              <input
                id="bookingOtpCode"
                name="bookingOtpCode"
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="form-control booking-otp-code-input"
                value={inputOtp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setInputOtp(value);
                }}
                placeholder="Nhập 6 chữ số"
                maxLength={6}
                aria-label="Mã OTP 6 chữ số"
              />
              <Button
                type="button"
                className="mt-3 w-100"
                onClick={confirmOtpAndSubmit}
                variant="success"
              >
                Xác thực & Đặt bàn
              </Button>
            </div>
          ) : null}

          {otpStatus ? (
            <Alert variant="info" className="mt-3 mb-0">
              {otpStatus}
            </Alert>
          ) : null}
        </Modal.Body>
      </Modal>
      <DishSelectionModal
        show={showDishModal}
        onHide={() => setShowDishModal(false)}
        menuItems={menuItems}
        selectedDishes={selectedDishes}
        setSelectedDishes={setSelectedDishes}
      />
    </>
  );
}

export default Reservation;
