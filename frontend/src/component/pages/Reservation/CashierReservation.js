import React, { useState, useEffect } from 'react';
import {
  Container, Form, Button, Row, Col, Alert, FloatingLabel, Modal,
  Card
} from 'react-bootstrap';
import Header from '../../Header/AdminHeader';
import StaffHeader from '../../Header/StaffHeader';
import CashierHeader from '../../Header/CashierHeader';
import './css/AdminReservation.css';

function Reservation() {
  const user = JSON.parse(localStorage.getItem('user'));

  const [filters, setFilters] = useState({
    phone: '',
    name: '',
    reservationDate: '',
    startTime: '',
    endTime: '',
    guestCount: '',
    status: '',
    specialRequest: '',
    page: 1,
    limit: 10,
  });

  const [reservations, setReservations] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    if (isNaN(date)) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchReservations = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`http://localhost:8080/api/reservation?${query}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reservations');

      console.log(data.reservations)
      setReservations(data.reservations);
      setTotalPages(data.totalPages);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8080/api/reservation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      setShowModal(false);
      fetchReservations();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filters]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success';
      case 'pending':
        return 'bg-warning text-dark';
      case 'cancelled':
        return 'bg-secondary';
      case 'expired':
        return 'bg-danger';
    }
  };

  const translateStatusName = (name) => {
    switch (name) {
      case 'pending':
        return 'Chưa đến';
      case 'confirmed':
        return 'Đã nhận';
      case 'cancelled':
        return 'Đã hủy';
      case 'expired':
        return 'Hết hạn';
    }
  };

  function isAtLeast15MinutesInFuture(reservationDate, reservationTime) {
    if (!reservationDate || !reservationTime || typeof reservationTime !== 'string') {
      console.warn('Invalid reservation datetime:', { reservationDate, reservationTime });
      return false;
    }
    try {
      const now = new Date();
      const [hours, minutes] = reservationTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return false;
      const reservation = new Date(reservationDate);
      if (isNaN(reservation)) return false;
      reservation.setHours(hours);
      reservation.setMinutes(minutes);
      reservation.setSeconds(0);
      reservation.setMilliseconds(0);
      const diffMs = reservation - now;
      const diffMinutes = diffMs / (1000 * 60);
      return diffMinutes >= 15;
    } catch (e) {
      console.error('Failed to parse reservation datetime:', e);
      return false;
    }
  }

  return (
    <>
      {user.role === 'admin' && <Header />}
      {user.role === 'staff' && <StaffHeader />}
      {user.role === 'cashier' && <CashierHeader />}

      <Container className="mt-4 booking-form-container">
        <h3 className="mb-4 text-center" style={{ color: "#ffc107" }}>Quản lý Đặt bàn</h3>

        <Form className="mb-4" onSubmit={(e) => e.preventDefault()}>
          <Row>
            <Col md={3}>
              <FloatingLabel label="SĐT">
                <Form.Control
                  type="input"
                  value={filters.phone}
                  onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value, page: 1 }))}
                  style={{ backgroundColor: '#ffffff', color: '#000000' }}
                />
              </FloatingLabel>
            </Col>
            <Col md={3}>
              <FloatingLabel label="Tên người đặt">
                <Form.Control
                  type="input"
                  value={filters.name}
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value, page: 1 }))}
                  style={{ backgroundColor: '#ffffff', color: '#000000' }}
                />
              </FloatingLabel>
            </Col>
            <Col md={3}>
              <FloatingLabel label="Ngày đặt">
                <Form.Control
                  type="date"
                  value={filters.reservationDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, reservationDate: e.target.value, page: 1 }))}
                />
              </FloatingLabel>
            </Col>
            {/*
            <Col md={3}>
              <FloatingLabel label="Guest Count">
                <Form.Control
                  type="number"
                  value={filters.guestCount}
                  onChange={(e) => setFilters(prev => ({ ...prev, guestCount: e.target.value, page: 1 }))}
                />
              </FloatingLabel>
            </Col>
            */}
            <Col md={2} className='mt-1'>
              <FloatingLabel label="Trạng thái">
                <Form.Select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chưa đến</option>
                  <option value="confirmed">Đã nhận</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="expired">Hết hạn</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
          </Row>
        </Form>

        {loading ? (
          <div className="text-center"><div className="spinner-border" /></div>
        ) : apiError ? (
          <Alert variant="danger">{apiError}</Alert>
        ) : (
          <>
            <table className="table table-dark table-striped table-hover mt-3">
              <thead>
                <tr style={{ color: 'white' }}>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r, idx) => {
                  if (r?.status === 'pending' &&
                    !isAtLeast15MinutesInFuture(r?.reservationDate, r?.reservationTime))
                    r.status = 'expired'
                  return (
                    <tr key={idx}>
                      <td>{r?.phone || 'N/A'}</td>
                      <td>{r?.email || 'N/A'}</td>
                      <td>{r?.name || 'N/A'}</td>
                      <td>{formatDate(r?.reservationDate)}</td>
                      <td>{r?.reservationTime || 'N/A'}</td>
                      <td>{r?.guestCount || 0}</td>
                      <td>
                        <span className={`badge ${getStatusClass(r?.status)}`}>
                          {translateStatusName(r?.status)}
                        </span>
                      </td>
                      <td className="text-center">
                        <Button size="sm" variant="warning" onClick={() => { setSelectedReservation(r); setShowModal(true); }}>Chi tiết</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="d-flex justify-content-center mt-3">
              <Button
                variant="outline-warning"
                disabled={filters.page <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Quay lại
              </Button>
              <span className="mx-3 text-warning align-self-center">
                Trang {filters.page} của {totalPages}
              </span>
              <Button
                variant="outline-warning"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Tiếp
              </Button>
            </div>
          </>
        )}
      </Container>

      {selectedReservation && (
        <Modal show={showModal} onHide={() => setShowModal(false)} size='xl'>
          <Modal.Header closeButton>
            <Modal.Title>Reservation Detail</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <label className="fw-bold">Cập nhật trạng thái:</label>
            <Form.Select
              className="mt-2 mb-4"
              value={selectedReservation.status}
              onChange={(e) => handleUpdateStatus(selectedReservation._id, e.target.value)}
            >
              {
                ['expired'].includes(selectedReservation.status) &&
                <option selected={true} disabled={true} value="">Hết hạn</option>
              }
              {
                ['confirmed'].includes(selectedReservation.status) &&
                <>
                <option selected={true} disabled={true}>Đã nhận</option>
                </>
              }
              {
                !['expired', 'confirmed'].includes(selectedReservation.status) &&
                <>
                  <option value="pending">Chưa đến</option>
                  <option value="cancelled">Hủy</option>
                </>
              }
            </Form.Select>

            <div>
              <h4 className="mb-3">Các món yêu cầu trước:</h4>
              <div className="row g-3">
                {selectedReservation?.preOrders.map((item, index) => (
                  <div className="col-md-4 col-sm-6" key={index}>
                    <Card className="h-100 shadow-sm" style={{ backgroundColor: 'white' }}>
                      <Card.Img
                        variant="top"
                        src={item?.itemId?.image}
                        style={{ height: '180px', objectFit: 'cover' }}
                      />
                      <Card.Body>
                        <Card.Title className="text-truncate">{item?.itemId?.name}</Card.Title>
                        <Card.Text>
                          <strong>Số lượng: {item.amount}</strong>
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </Modal.Body>

        </Modal>
      )}
    </>
  );
}

export default Reservation;
