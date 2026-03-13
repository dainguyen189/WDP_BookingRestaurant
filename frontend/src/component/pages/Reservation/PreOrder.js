import React, { useState, useEffect } from 'react';
import {
    Container, Form, Button, Row, Col, Alert, FloatingLabel, Card, Badge, Table
} from 'react-bootstrap';
import Header from '../../Header/AdminHeader';
import StaffHeader from '../../Header/StaffHeader';
import CashierHeader from '../../Header/CashierHeader';
import './AdminReservation.css';

function PreOrdersSummary() {
    const user = JSON.parse(localStorage.getItem('user'));

    const [filters, setFilters] = useState({
        reservationDate: new Date().toISOString().split('T')[0],
        itemName: '',
        status: '',
    });

    const [preOrdersSummary, setPreOrdersSummary] = useState([]);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [totalItems, setTotalItems] = useState(0);

    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const fetchPreOrdersSummary = async () => {
        setLoading(true);
        setApiError(null);
        try {
            const query = new URLSearchParams({
                reservationDate: filters.reservationDate,
                status: filters.status
            }).toString();

            const res = await fetch(`http://localhost:8080/api/reservation?${query}&limit=1000`, {
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch reservations');

            const itemSummary = new Map();

            data.reservations.forEach(reservation => {
                if (reservation.preOrders && reservation.preOrders.length > 0) {
                    reservation.preOrders.forEach(preOrder => {
                        const itemId = preOrder.itemId?._id;
                        const itemName = preOrder.itemId?.name || '';

                        if (filters.itemName && !itemName.toLowerCase().includes(filters.itemName.toLowerCase())) {
                            return;
                        }
                        if (filters.status && preOrder.status !== filters.status) {
                            return;
                        }

                        if (itemId) {
                            if (itemSummary.has(itemId)) {
                                const existingItem = itemSummary.get(itemId);
                                existingItem.totalAmount += preOrder.amount;
                                existingItem.orders.push({
                                    amount: preOrder.amount,
                                    status: preOrder.status || 'pending'
                                });
                            } else {
                                itemSummary.set(itemId, {
                                    itemId: itemId,
                                    itemName: itemName,
                                    itemImage: preOrder.itemId?.image,
                                    itemPrice: preOrder.itemId?.price || 0,
                                    totalAmount: preOrder.amount,
                                    orders: [{
                                        amount: preOrder.amount,
                                        status: preOrder.status || 'pending'
                                    }]
                                });
                            }
                        }
                    });
                }
            });

            const summaryArray = Array.from(itemSummary.values()).sort((a, b) =>
                a.itemName.localeCompare(b.itemName)
            );

            setPreOrdersSummary(summaryArray);
            setTotalItems(summaryArray.reduce((sum, item) => sum + item.totalAmount, 0));
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreOrdersSummary();
        // eslint-disable-next-line
    }, [filters]);

    const getStatusBadge = (orders) => {
        const statusCount = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + order.amount;
            return acc;
        }, {});

        return Object.entries(statusCount).map(([status, count]) => (
            <span key={status} className={`me-2 text-${getStatusClass(status)} fw-bold`}>
                {translateStatusName(status)}: {count}
            </span>
        ));
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'prepared':
                return 'success';
            case 'preparing':
                return 'warning';
            case 'pending':
                return 'info';
            case 'cancelled':
                return 'secondary';
            default:
                return 'light';
        }
    };

    const translateStatusName = (name) => {
        switch (name) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'preparing':
                return 'Đang chuẩn bị';
            case 'prepared':
                return 'Đã chuẩn bị';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return name;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <>
            {user.role === 'admin' && <Header />}
            {user.role === 'staff' && <StaffHeader />}
            {user.role === 'cashier' && <CashierHeader />}

            <Container className="mt-4 booking-form-container">
                <Card className="mb-4 shadow" style={{ background: 'linear-gradient(90deg, #232526 0%, #414345 100%)', border: 'none' }}>
                    <Card.Body>
                        <h2 className="mb-2 text-center" style={{ color: "#ffc107", fontWeight: 700, letterSpacing: 1 }}>
                            Tổng hợp Món ăn Đặt trước
                        </h2>
                        <div className="text-center mb-2" style={{ color: "#fff" }}>
                            <span style={{ fontSize: 18 }}>Ngày: <b>{formatDate(filters.reservationDate)}</b></span>
                        </div>
                        <Row className="justify-content-center">
                            <Col md={4} className="mb-2">
                                <FloatingLabel label="Ngày đặt bàn">
                                    <Form.Control
                                        type="date"
                                        value={filters.reservationDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, reservationDate: e.target.value }))}
                                        style={{ backgroundColor: '#fff', color: '#000' }}
                                    />
                                </FloatingLabel>
                            </Col>
                            <Col md={4} className="mb-2">
                                <FloatingLabel label="Tên món ăn">
                                    <Form.Control
                                        type="text"
                                        value={filters.itemName}
                                        onChange={(e) => setFilters(prev => ({ ...prev, itemName: e.target.value }))}
                                        style={{ backgroundColor: '#fff', color: '#000' }}
                                        placeholder="Tìm kiếm món ăn..."
                                    />
                                </FloatingLabel>
                            </Col>

                        </Row>
                    </Card.Body>
                </Card>

                <Row className="mb-4">
                    <Col md={4}>
                        <Card className="text-center shadow" style={{ background: '#232526', border: 'none' }}>
                            <Card.Body>
                                <Card.Title style={{ color: '#ffc107' }}>Số loại món</Card.Title>
                                <h4>
                                    <span className="text-primary fw-bold">{preOrdersSummary.length} loại</span>
                                </h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center shadow" style={{ background: '#232526', border: 'none' }}>
                            <Card.Body>
                                <Card.Title style={{ color: '#ffc107' }}>Tổng số lượng</Card.Title>
                                <h4>
                                    <span className="text-warning fw-bold">{totalItems} </span>
                                </h4>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="text-center shadow" style={{ background: '#232526', border: 'none' }}>
                            <Card.Body>
                                <Card.Title style={{ color: '#ffc107' }}>Tổng giá trị</Card.Title>
                                <h4>
                                    <span className="text-success fw-bold">{formatCurrency(preOrdersSummary.reduce((sum, item) => sum + (item.itemPrice * item.totalAmount), 0))}</span>
                                </h4>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {loading ? (
                    <div className="text-center">
                        <div className="spinner-border text-warning" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : apiError ? (
                    <Alert variant="danger">{apiError}</Alert>
                ) : (
                    <>
                        {preOrdersSummary.length > 0 ? (
                            <Card className="shadow" style={{ background: '#343a40', border: 'none' }}>
                                <Card.Body>
                                    <Table 
                                        striped 
                                        hover 
                                        variant="dark" 
                                        className="mb-0"
                                        style={{ borderRadius: '10px', overflow: 'hidden' }}
                                    >
                                        <thead style={{ background: '#232526' }}>
                                            <tr>
                                                <th className="text-warning">STT</th>
                                                <th className="text-warning">Hình ảnh</th>
                                                <th className="text-warning">Tên món ăn</th>
                                                <th className="text-warning text-center">Số lượng</th>
                                                <th className="text-warning text-center">Giá đơn vị</th>
                                                <th className="text-warning text-center">Tổng giá trị</th>
                                                
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preOrdersSummary.map((item, idx) => (
                                                <tr key={item.itemId || idx}>
                                                    <td className="text-white align-middle">{idx + 1}</td>
                                                    <td className="align-middle">
                                                        <img
                                                            src={item.itemImage || '/default-food.jpg'}
                                                            alt={item.itemName}
                                                            style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                objectFit: 'cover',
                                                                borderRadius: '8px',
                                                                border: '2px solid #ffc107'
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="text-white align-middle">
                                                        <strong>{item.itemName}</strong>
                                                    </td>
                                                    <td className="text-center align-middle">
                                                        <Badge bg="warning" text="dark" style={{ fontSize: '14px' }}>
                                                            {item.totalAmount}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center align-middle">
                                                        <Badge bg="info" style={{ fontSize: '14px' }}>
                                                            {formatCurrency(item.itemPrice)}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-center align-middle">
                                                        <Badge bg="success" style={{ fontSize: '14px' }}>
                                                            {formatCurrency(item.itemPrice * item.totalAmount)}
                                                        </Badge>
                                                    </td>
                                                    
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        ) : (
                            <div className="text-center text-warning mt-4">
                                <div className="p-4" style={{ backgroundColor: '#343a40', borderRadius: '10px', border: '1px solid #ffc107' }}>
                                    <h5>Không có món ăn đặt trước nào</h5>
                                    <p className="text-muted">Cho ngày {formatDate(filters.reservationDate)} với các bộ lọc hiện tại</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </>
    );
}

export default PreOrdersSummary;