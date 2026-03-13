import React, { useState, useEffect } from 'react';
import CashierHeader from '../../Header/CashierHeader';

import './OrdersList.css';

function OrdersList() {
  const user = JSON.parse(sessionStorage.getItem('user') || '{"role": "cashier"}');

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0], 
    status: '',
    paymentStatus: '',
    tableId: '',
    customerName: '',
    page: 1,
    limit: 10,
  });

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState({});

  // ✅ HELPER FUNCTIONS
  const getTableNumber = (order) => {
    return order.sessionId?.table?.tableNumber || 
           order.sessionId?.table?.number ||
           order.sessionId?.tableNumber || 
           order.tableNumber ||
           order.customerInfo?.table?.number ||
           order.customerInfo?.table?.tableNumber ||
           'N/A';
  };

  const getCustomerName = (order) => {
    return order.customerInfo?.customerName || 
           order.sessionId?.customerName ||
           order.customerInfo?.registeredUser?.username || 
           order.userId?.username ||
           'Khách vãng lai';
  };

  const getCustomerPhone = (order) => {
    return order.customerInfo?.customerPhone || 
           order.sessionId?.customerPhone ||
           order.customerInfo?.registeredUser?.phone || 
           order.userId?.phone ||
           'N/A';
  };

  const getGuestCount = (order) => {
    return order.customerInfo?.guestCount || 
           order.sessionId?.guestCount || 
           1;
  };

  // ✅ HELPER FUNCTIONS FOR PRICING CALCULATION
  const calculateSubtotal = (order) => {
    if (!order.items) return 0;
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = (order) => {
    const subtotal = calculateSubtotal(order);
    const total = order.totalAmount || 0;
    const discount = subtotal - total;
    return discount > 0 ? discount : 0;
  };

  const getDiscountPercentage = (order) => {
    const subtotal = calculateSubtotal(order);
    const discountAmount = getDiscountAmount(order);
    if (subtotal === 0) return 0;
    return Math.round((discountAmount / subtotal) * 100);
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setApiError(null);
    try {
      // Build query parameters - chỉ gửi date để lấy tất cả orders của ngày đó
      const queryParams = new URLSearchParams();
      if (filters.date) {
        queryParams.append('date', filters.date);
      }
  
      const res = await fetch(`http://localhost:8080/api/orders?${queryParams}`, {
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');

      console.log('Orders data:', data);
      
      setOrders(data.orders || []); 
      setSummary(data.summary || {});
      
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CLIENT-SIDE FILTERING FUNCTION
  const applyFilters = () => {
    let filtered = [...orders];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filter by payment status
    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    // Filter by customer name
    if (filters.customerName.trim()) {
      filtered = filtered.filter(order => {
        const customerName = getCustomerName(order).toLowerCase();
        return customerName.includes(filters.customerName.toLowerCase().trim());
      });
    }

    // Filter by table ID
    if (filters.tableId.trim()) {
      filtered = filtered.filter(order => {
        const tableNumber = getTableNumber(order).toString().toLowerCase();
        return tableNumber.includes(filters.tableId.toLowerCase().trim());
      });
    }

    setFilteredOrders(filtered);
    setTotalPages(Math.ceil(filtered.length / filters.limit));
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkAsPaid = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/pay-by-cash`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) throw new Error('Failed to mark as paid');
      
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ FETCH DATA WHEN DATE CHANGES
  useEffect(() => {
    fetchOrders();
  }, [filters.date]);

  // ✅ APPLY FILTERS WHEN ORDERS OR FILTER CRITERIA CHANGE
  useEffect(() => {
    applyFilters();
  }, [orders, filters.status, filters.paymentStatus, filters.customerName, filters.tableId]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'preparing':
        return 'status-preparing';
      case 'ready':
        return 'status-ready';
      case 'served':
        return 'status-served';
      default:
        return 'status-default';
    }
  };

  const getPaymentStatusClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'payment-paid';
      case 'unpaid':
        return 'payment-unpaid';
      default:
        return 'payment-default';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'preparing':
        return 'Đang chuẩn bị';
      case 'ready':
        return 'Sẵn sàng';
      case 'served':
        return 'Đã phục vụ';
      default:
        return status;
    }
  };

  const translatePaymentStatus = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'Đã thanh toán';
      case 'unpaid':
        return 'Chưa thanh toán';
      default:
        return paymentStatus;
    }
  };

  return (
    <>
      <CashierHeader />
    <div style={{ 
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="container">
        <div className="main-card">
          <h3 className="main-title">
            Quản lý Đơn hàng
          </h3>

          {/* Summary Cards */}
          {summary && Object.keys(summary).length > 0 && (
            <div className="summary-grid">
              <div className="summary-card summary-total">
                <h4>{summary.totalOrders || 0}</h4>
                <p>Tổng Orders</p>
              </div>
              <div className="summary-card summary-revenue">
                <h4>{formatCurrency(summary.totalRevenue)}</h4>
                <p>Tổng Doanh thu</p>
              </div>
              <div className="summary-card summary-pending">
                <h4>{summary.ordersByStatus?.pending || 0}</h4>
                <p>Chờ xử lý</p>
              </div>
              <div className="summary-card summary-unpaid">
                <h4>{summary.paymentStatusBreakdown?.unpaid || 0}</h4>
                <p>Chưa thanh toán</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="filters-section">
            <div className="filters-grid">
              <div className="filter-group">
                <label>Ngày</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value, page: 1 }))}
                  className="form-input"
                />
              </div>
              <div className="filter-group">
                <label>Trạng thái</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="form-input"
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="preparing">Đang chuẩn bị</option>
                  <option value="ready">Sẵn sàng</option>
                  <option value="served">Đã phục vụ</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Thanh toán</label>
                <select
                  value={filters.paymentStatus || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value, page: 1 }))}
                  className="form-input"
                >
                  <option value="">Tất cả</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="unpaid">Chưa thanh toán</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Tên khách hàng</label>
                <input
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value, page: 1 }))}
                  className="form-input"
                  placeholder="Nhập tên khách hàng..."
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : apiError ? (
            <div className="error-alert">
              ❌ {apiError}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Mã Order</th>
                      <th>Thời gian</th>
                      <th>Khách hàng</th>
                      <th>Bàn</th>
                      <th>Số khách</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Thanh toán</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, idx) => (
                      <tr key={idx} className="table-row">
                        <td>
                          <strong>#{order._id?.substring(0, 8)}</strong>
                        </td>
                        <td>
                          <div className="time-info">
                            <div>{formatDate(order.orderTime)}</div>
                            <small>{formatTime(order.orderTime)}</small>
                          </div>
                        </td>
                        <td>
                          <div className="customer-info">
                            <div className="customer-name">{getCustomerName(order)}</div>
                            <small> {getCustomerPhone(order)}</small>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">
                             Bàn {getTableNumber(order)}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-secondary">
                            {getGuestCount(order)}
                          </span>
                        </td>
                        <td>
                          <strong className="total-amount">
                            {formatCurrency(order.totalAmount)}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${getStatusClass(order.status)}`}>
                            {translateStatus(order.status)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getPaymentStatusClass(order.paymentStatus)}`}>
                            {translatePaymentStatus(order.paymentStatus)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn btn-warning" 
                              onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="empty-state">
                  <h4>Không có đơn hàng nào</h4>
                  <p>Chưa có đơn hàng nào phù hợp với bộ lọc hiện tại</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết Order #{selectedOrder._id?.substring(0, 8)}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Order Status Update */}
              <div className="status-update-section">
                <div className="status-group">
                  <label>Cập nhật trạng thái:</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                    className="form-input"
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="preparing">Đang chuẩn bị</option>
                    <option value="ready">Sẵn sàng</option>
                    <option value="served">Đã phục vụ</option>
                  </select>
                </div>
                
                {/* ✅ ENHANCED PRICING BREAKDOWN */}
                <div className="pricing-breakdown">
                  <div className="price-row">
                    <label>Tạm tính:</label>
                    <span className="price-value">
                      {formatCurrency(calculateSubtotal(selectedOrder))}
                    </span>
                  </div>
                  
                  {getDiscountAmount(selectedOrder) > 0 && (
                    <div className="price-row discount-row">
                      <label>Giảm giá ({getDiscountPercentage(selectedOrder)}%):</label>
                      <span className="price-value discount-value">
                        -{formatCurrency(getDiscountAmount(selectedOrder))}
                      </span>
                    </div>
                  )}
                  
                  <div className="price-row total-row">
                    <label><strong>Tổng thanh toán:</strong></label>
                    <h3 className="total-price">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="customer-section">
                <h5>👤 Thông tin khách hàng</h5>
                <div className="customer-details">
                  <p><strong>Tên:</strong> {getCustomerName(selectedOrder)}</p>
                  <p><strong>SĐT:</strong> {getCustomerPhone(selectedOrder)}</p>
                  <p><strong>Bàn:</strong> {getTableNumber(selectedOrder)}</p>
                  <p><strong>Số khách:</strong> {getGuestCount(selectedOrder)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="items-section">
                <h5>🍽️ Món đã order ({selectedOrder.items?.length || 0} món)</h5>
                <div className="items-grid">
                  {selectedOrder.items?.map((item, index) => {
                    const menuItem = item.menuItemId || {};
                    return (
                      <div className="item-card" key={index}>
                        <img
                          src={menuItem.image || '/placeholder-food.jpg'}
                          alt={menuItem.name}
                          className="item-image"
                          onError={(e) => {
                            e.target.src = '/placeholder-food.jpg';
                          }}
                        />
                        <div className="item-info">
                          <h6>{menuItem.name || 'Món ăn'}</h6>
                          <div className="item-details">
                            <div><strong>Số lượng:</strong> {item.quantity}</div>
                            <div><strong>Đơn giá:</strong> {formatCurrency(item.price)}</div>
                            <div className="item-total">
                              <strong>Thành tiền: {formatCurrency(item.price * item.quantity)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              {/* {selectedOrder.paymentStatus === 'unpaid' && (
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    handleMarkAsPaid(selectedOrder._id);
                    setShowModal(false);
                  }}
                >
                  Đánh dấu đã thanh toán
                </button>
              )} */}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default OrdersList;