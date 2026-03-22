import React, { useState } from 'react';
import {
  Container, Form, Button, Row, Col, Alert, FloatingLabel
} from 'react-bootstrap';
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function Reservation() {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    reservationDate: '',
    reservationTime: '',
    guestCount: 1,
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const validate = () => {
    const errs = {};
    const phoneRegex = /^\+?[1-9][0-9]{7,14}$/;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!phoneRegex.test(formData.phone)) errs.phone = 'Invalid phone number';
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.reservationDate) errs.reservationDate = 'Date is required';
    if (!timeRegex.test(formData.reservationTime)) errs.reservationTime = 'Invalid time (HH:mm)';
    if (formData.guestCount < 1) errs.guestCount = 'At least 1 guest';

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

    try {
      const res = await fetch('http://localhost:8080/api/reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Reservation created successfully!');
        setFormData({
          phone: '',
          name: '',
          reservationDate: '',
          reservationTime: '',
          guestCount: 1,
        });
        setErrors({});
      } else {
        setErrors({ api: data.error || 'An error occurred' });
      }
    } catch (err) {
      setErrors({ api: err.message });
    }
  };

  return (
    <>
      <Header />
      <Container className="mt-4">
        <h3 className="mb-4 text-center">Đặt bàn</h3>

        {success && <Alert variant="success">{success}</Alert>}
        {errors.api && <Alert variant="danger">{errors.api}</Alert>}

        <Form onSubmit={handleSubmit} className="p-4 shadow-sm rounded bg-light">
          <Row className="mb-3">
            <Col md={6}>
              <FloatingLabel controlId="floatingPhone" label="Số điện thoại">
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  isInvalid={!!errors.phone}
                  onChange={handleChange}
                  placeholder="+84123456789"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={6}>
              <FloatingLabel controlId="floatingName" label="Name">
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  isInvalid={!!errors.name}
                  onChange={handleChange}
                  placeholder="Name"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <FloatingLabel controlId="floatingDate" label="Reservation Date">
                <Form.Control
                  type="date"
                  name="reservationDate"
                  value={formData.reservationDate}
                  isInvalid={!!errors.reservationDate}
                  onChange={handleChange}
                  placeholder="YYYY-MM-DD"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.reservationDate}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={6}>
              <FloatingLabel controlId="floatingTime" label="Reservation Time">
                <Form.Control
                  type="time"
                  name="reservationTime"
                  value={formData.reservationTime}
                  isInvalid={!!errors.reservationTime}
                  onChange={handleChange}
                  placeholder="HH:MM"
                  lang="en-GB"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.reservationTime}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <FloatingLabel controlId="floatingGuests" label="Guest Count">
                <Form.Control
                  type="number"
                  name="guestCount"
                  min="1"
                  value={formData.guestCount}
                  isInvalid={!!errors.guestCount}
                  onChange={handleChange}
                  placeholder="Guests"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.guestCount}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>
          </Row>

          <div className="text-center mt-4">
            <Button variant="primary" type="submit" size="lg">
              Đặt bàn
            </Button>
          </div>
        </Form>
      </Container>
      <Footer />
    </>
  );
}

export default Reservation;
