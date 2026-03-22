import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChefOrder.css';
import ChefHeader from '../../Header/ChefHeader';
import './css/Chef.css';
import { Row, Col, Form, Button } from 'react-bootstrap';

const Chef = () => {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'preparing',
    tableNumber: ''
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filter.date) params.append('date', filter.date);
      if (filter.tableNumber) params.append('tableNumber', filter.tableNumber);
      if (filter.status && filter.status !== 'all') params.append('status', filter.status);

      const response = await axios.get(`http://localhost:8080/api/order-items/chef?${params}`);
      setOrderItems(response.data.items || []);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/chef/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      setError('');
      console.log(newStatus)
      await axios.put(`http://localhost:8080/api/chef/order-items/${itemId}/status`, { status: newStatus });
      fetchOrders(false);
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật trạng thái món ăn');
    }
  };

  // ⏱️ Debounced fetch
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders();
      fetchStats();
    }, 300); // debounce 300ms
    return () => clearTimeout(timeout);
  }, [filter]);

  //useEffect(() => {
  //  const interval = setInterval(() => {
  //    fetchOrders(false); // refresh silently
  //  }, 5000); // every 5 seconds

  //  return () => clearInterval(interval); // cleanup
  //}, []);

  const getItemStatusBadge = (status) => {
    const config = {
      ordered: { class: 'item-status-ordered', label: 'Chưa xử lý' },
      preparing: { class: 'item-status-preparing', label: 'Đã nhận' },
      cooking: { class: 'item-status-preparing', label: 'Đang nấu' },
      done: { class: 'item-status-done', label: 'Xong' }
    }[status] || {};
    return <span className={`item-status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'ordered', label: 'Chưa xử lý' },
    { value: 'preparing', label: 'Đã nhận' },
    { value: 'cooking', label: 'Đang nấu' },
    { value: 'done', label: 'Xong' },
  ];


  return (
    <>
      <ChefHeader />
      <div className="chef-order-container">
        <div className="chef-header">
          <h1>🧑‍🍳 Chef – Xem đơn hàng</h1>
          <div>{refreshing ? '🔄 Refreshing...' : ''}</div>
        </div>

        {/* 🔍 Filters */}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Control
              type="date"
              value={filter.date}
              onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
            />
          </Col>

          <Col md={3}>
            <Form.Control
              type="text"
              value={filter.tableNumber}
              onChange={(e) => setFilter(prev => ({ ...prev, tableNumber: e.target.value }))}
              placeholder="Số bàn"
            />
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <div className="d-flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={filter.status === option.value ? 'primary' : 'outline-primary'}
                  onClick={() => setFilter(prev => ({ ...prev, status: option.value }))}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </Col>
        </Row>


        {/* 🧾 Items */}
        <div className="order-items-list">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">🧑‍🍳</div>
              <p>Không có món ăn nào</p>
            </div>
          ) : (
            orderItems.map(item => {
              const table = item?.table || 'Không rõ';

              return (
                <div key={item._id} className="order-item-card">
                  <div className='row'>
                    <div className="order-item-header">
                      <h2>{`${item.quantity} x ${item.name}` || 'Món ăn không xác định'}</h2>
                      {getItemStatusBadge(item.status)}
                    </div>

                    <div className="d-flex justify-content-between">
                      <strong>Bàn: {table} | {item.customerName}</strong>
                      <span>{item?.orderTime ? formatTime(item.orderTime) : 'N/A'}</span>
                    </div>

                  </div>
                  <div className='row'>
                    <div className="order-item-actions">
                      {item.status === 'preparing' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => updateItemStatus(item._id, 'cooking')}>
                          Bắt đầu nấu
                        </button>
                      )}
                      {item.status === 'cooking' && (
                        <>
                          <button
                            className='btn btn-danger'
                            onClick={() => updateItemStatus(item._id, 'preparing')}
                          >
                            Chưa nấu
                          </button>
                          <button
                            className="btn btn-success"
                            onClick={() => updateItemStatus(item._id, 'done')}>
                            Hoàn thành
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div >
    </>
  );
};

export default Chef;

