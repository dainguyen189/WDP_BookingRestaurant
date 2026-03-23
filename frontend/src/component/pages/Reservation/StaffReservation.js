import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Alert,
  FloatingLabel,
  Modal,
  Card,
} from "react-bootstrap";
import Header from "../../Header/AdminHeader";
import StaffHeader from "../../Header/StaffHeader";
import CashierHeader from "../../Header/CashierHeader";
import "./css/AdminReservation.css";

function Reservation() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [filters, setFilters] = useState({
    phone: "",
    name: "",
    reservationDate: "",
    startTime: "",
    endTime: "",
    guestCount: "",
    status: "",
    specialRequest: "",
    page: 1,
    limit: 10,
  });

  const [reservations, setReservations] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ====== Format ngày dd/mm/yyyy ======
  const formatDate = (isoDate) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    if (isNaN(date)) return "N/A";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // ====== Lấy danh sách đặt bàn ======
  const fetchReservations = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(
        `http://localhost:8080/api/reservation?${query}`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to fetch reservations");

      console.log("📋 Reservations fetched:", data.reservations);
      setReservations(
        Array.isArray(data.reservations) ? data.reservations : [],
      );
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== Cập nhật trạng thái đặt bàn ======
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8080/api/reservation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setShowModal(false);
      fetchReservations();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filters]);

  // ====== Phân loại màu trạng thái ======
  const getStatusClass = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-success";
      case "pending":
        return "bg-warning text-dark";
      case "cancelled":
        return "bg-secondary";
      case "expired":
        return "bg-danger";
      default:
        return "bg-light text-dark";
    }
  };

  // ====== Dịch trạng thái sang tiếng Việt ======
  const translateStatusName = (name) => {
    switch (name) {
      case "pending":
        return "Chưa đến";
      case "confirmed":
        return "Khách đã đến";
      case "cancelled":
        return "Đã hủy";
      case "expired":
        return "Hết hạn";
      default:
        return "Không xác định";
    }
  };

  // ====== Kiểm tra xem đặt bàn còn hợp lệ không ======
  function isAtLeast15MinutesInFuture(reservationDate, reservationTime) {
    if (
      !reservationDate ||
      !reservationTime ||
      typeof reservationTime !== "string"
    ) {
      console.warn("⚠️ Dữ liệu đặt bàn không hợp lệ:", {
        reservationDate,
        reservationTime,
      });
      return false; // coi như không còn hợp lệ
    }

    try {
      const now = new Date();
      const [hours, minutes] = reservationTime.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return false;

      const reservation = new Date(reservationDate);
      reservation.setHours(hours);
      reservation.setMinutes(minutes);
      reservation.setSeconds(0);
      reservation.setMilliseconds(0);

      const diffMs = reservation - now;
      const diffMinutes = diffMs / (1000 * 60);
      return diffMinutes >= 15;
    } catch (error) {
      console.error("❌ Lỗi khi xử lý thời gian đặt bàn:", error);
      return false;
    }
  }

  // ====== Render giao diện ======
  return (
    <>
      {user?.role === "admin" && <Header />}
      {user?.role === "staff" && <StaffHeader />}
      {user?.role === "cashier" && <CashierHeader />}

      <div className="reservation-admin-page">
        <Container className="mt-4 booking-form-container">
          <h3 className="mb-4 text-center reservation-admin-title">
            Quản lý Đặt bàn
          </h3>

          {/* Bộ lọc */}
          <Form className="mb-4" onSubmit={(e) => e.preventDefault()}>
            <Row>
              <Col md={3}>
                <FloatingLabel label="SĐT">
                  <Form.Control
                    type="text"
                    value={filters.phone}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        phone: e.target.value,
                        page: 1,
                      }))
                    }
                  />
                </FloatingLabel>
              </Col>
              <Col md={3}>
                <FloatingLabel label="Tên người đặt">
                  <Form.Control
                    type="text"
                    value={filters.name}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        name: e.target.value,
                        page: 1,
                      }))
                    }
                  />
                </FloatingLabel>
              </Col>
              <Col md={3}>
                <FloatingLabel label="Ngày đặt">
                  <Form.Control
                    type="date"
                    value={filters.reservationDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        reservationDate: e.target.value,
                        page: 1,
                      }))
                    }
                  />
                </FloatingLabel>
              </Col>
              <Col md={2} className="mt-1">
                <FloatingLabel label="Trạng thái">
                  <Form.Select
                    value={filters.status || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                        page: 1,
                      }))
                    }
                  >
                    <option value="">Tất cả</option>
                    <option value="pending">Chưa đến</option>
                    <option value="confirmed">Khách đã đến</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="expired">Hết hạn</option>
                  </Form.Select>
                </FloatingLabel>
              </Col>
            </Row>
          </Form>

          {/* Kết quả */}
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" />
            </div>
          ) : apiError ? (
            <Alert variant="danger">{apiError}</Alert>
          ) : (
            <>
              <table className="table table-striped table-hover reservation-admin-table mt-3">
                <thead>
                  <tr>
                    <th>SĐT</th>
                    <th>Email</th>
                    <th>Tên</th>
                    <th>Ngày</th>
                    <th>Giờ</th>
                    <th>Khách</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center reservation-empty-row"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    reservations.map((r, idx) => {
                      if (
                        r?.status === "pending" &&
                        !isAtLeast15MinutesInFuture(
                          r?.reservationDate,
                          r?.reservationTime,
                        )
                      ) {
                        r.status = "expired";
                      }
                      return (
                        <tr key={idx}>
                          <td>{r?.phone || "N/A"}</td>
                          <td>{r?.email || "N/A"}</td>
                          <td>{r?.name || "N/A"}</td>
                          <td>{formatDate(r?.reservationDate)}</td>
                          <td>{r?.reservationTime || "N/A"}</td>
                          <td>{r?.guestCount || 0}</td>
                          <td>
                            <span
                              className={`badge ${getStatusClass(r?.status)}`}
                            >
                              {translateStatusName(r?.status)}
                            </span>
                          </td>
                          <td className="text-center">
                            <Button
                              size="sm"
                              className="btn-reservation-detail"
                              onClick={() => {
                                setSelectedReservation(r);
                                setShowModal(true);
                              }}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Phân trang */}
              <div className="d-flex justify-content-center align-items-center mt-4 gap-2 reservation-pagination flex-wrap">
                <Button
                  variant="outline-success"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Quay lại
                </Button>
                <span className="mx-2 reservation-page-indicator align-self-center">
                  Trang {filters.page} của {totalPages}
                </span>
                <Button
                  variant="outline-success"
                  disabled={filters.page >= totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Tiếp
                </Button>
              </div>
            </>
          )}
        </Container>
      </div>

      {/* Chi tiết đặt bàn */}
      {selectedReservation && (
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
          scrollable
          className="reservation-admin-detail-modal-root"
          dialogClassName="reservation-admin-detail-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết đặt bàn</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <label className="fw-bold">Cập nhật trạng thái:</label>
            <Form.Select
              className="mt-2 mb-4"
              value={selectedReservation?.status}
              onChange={(e) =>
                handleUpdateStatus(selectedReservation?._id, e.target.value)
              }
              disabled={selectedReservation?.status === "expired"}
            >
              {selectedReservation?.status === "expired" ? (
                <option value="expired">Hết hạn</option>
              ) : (
                <>
                  <option value="pending">Chưa đến</option>
                  <option value="confirmed">Khách đã đến</option>
                  <option value="cancelled">Hủy</option>
                </>
              )}
            </Form.Select>

            <div>
              <h4 className="mb-3">Các món yêu cầu trước:</h4>
              <div className="row g-3">
                {selectedReservation?.preOrders?.length > 0 ? (
                  selectedReservation.preOrders.map((item, index) => (
                    <div className="col-md-4 col-sm-6" key={index}>
                      <Card
                        className="h-100 shadow-sm"
                        style={{ backgroundColor: "white" }}
                      >
                        <Card.Img
                          variant="top"
                          src={item?.itemId?.image || "/no-image.png"}
                          style={{ height: "180px", objectFit: "cover" }}
                        />
                        <Card.Body>
                          <Card.Title className="text-truncate">
                            {item?.itemId?.name || "Món không xác định"}
                          </Card.Title>
                          <Card.Text>
                            <strong>Số lượng: {item?.amount || 0}</strong>
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Không có món đặt trước nào.</p>
                )}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

export default Reservation;
