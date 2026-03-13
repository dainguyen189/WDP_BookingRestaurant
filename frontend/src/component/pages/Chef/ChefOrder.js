import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChefOrder.css';
import StaffHeader from '../../Header/StaffHeader';

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Fetch orders từ API
  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`http://localhost:8080/api/chef/orders${statusParam}`);
      
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch stats cho dashboard
  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/chef/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // IMPROVED: Cập nhật trạng thái món ăn với thông báo tốt hơn
  const updateItemStatus = async (itemId, newStatus) => {
    try {
      setError('');
      
      const response = await axios.put(`http://localhost:8080/api/chef/order-items/${itemId}/status`, {
        status: newStatus
      });
      
      // Hiển thị thông báo với thông tin order status nếu có
      let message = `Đã cập nhật món ăn thành ${newStatus}`;
      if (response.data.orderStatus) {
        const statusLabels = {
          'pending': 'Chờ xử lý',
          'preparing': 'Đang nấu', 
          'served': 'Đã phục vụ'
        };
        message += `. Đơn hàng chuyển sang: ${statusLabels[response.data.orderStatus]}`;
      }
      
      alert(message);
      
      // Refresh dữ liệu
      fetchOrders(false);
      fetchStats();
      
    } catch (error) {
      console.error('Error updating item status:', error);
      setError('Không thể cập nhật trạng thái món ăn');
      alert('Không thể cập nhật trạng thái món ăn');
    }
  };

  // IMPROVED: Bắt đầu nấu tất cả món trong đơn hàng
  const startCookingOrder = async (orderId, items) => {
    try {
      setError('');
      
      // Lọc ra những món có status là 'ordered'
      const itemsToStart = items.filter(item => item.status === 'ordered');
      
      if (itemsToStart.length === 0) {
        alert('Không có món nào cần bắt đầu nấu');
        return;
      }

      // Gọi API để bắt đầu nấu order
      const response = await axios.put(`http://localhost:8080/api/chef/orders/${orderId}/start-cooking`);
      
      alert(`Đã bắt đầu nấu ${itemsToStart.length} món`);
      fetchOrders(false);
      fetchStats();
      
    } catch (error) {
      console.error('Error starting cooking order:', error);
      
      // Fallback: nếu không có API start-cooking, dùng cách cũ
      try {
        const updatePromises = items
          .filter(item => item.status === 'ordered')
          .map(item => 
            axios.put(`http://localhost:8080/api/chef/order-items/${item._id}/status`, {
              status: 'preparing'
            })
          );

        await Promise.all(updatePromises);
        
        // Cập nhật trạng thái đơn hàng
        await axios.put(`http://localhost:8080/api/chef/orders/${orderId}/status`, {
          status: 'preparing'
        });
        
        const itemsToStart = items.filter(item => item.status === 'ordered');
        alert(`Đã bắt đầu nấu ${itemsToStart.length} món`);
        fetchOrders(false);
        fetchStats();
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setError('Không thể bắt đầu nấu đơn hàng');
        alert('Không thể bắt đầu nấu đơn hàng');
      }
    }
  };

  // IMPROVED: Hoàn thành đơn hàng (hoàn thành tất cả món)
  const completeOrder = async (orderId, items) => {
    try {
      setError('');
      
      // Lọc ra những món có status là 'preparing'
      const itemsToComplete = items.filter(item => item.status === 'preparing');
      
      if (itemsToComplete.length === 0) {
        alert('Không có món nào đang nấu để hoàn thành');
        return;
      }

      // Cập nhật từng món một cách song song
      const updatePromises = itemsToComplete.map(item => 
        axios.put(`http://localhost:8080/api/chef/order-items/${item._id}/status`, {
          status: 'done'
        })
      );

      await Promise.all(updatePromises);
      
      alert(`Đã hoàn thành ${itemsToComplete.length} món và đơn hàng`);
      fetchOrders(false);
      fetchStats();
      
    } catch (error) {
      console.error('Error completing order:', error);
      setError('Không thể hoàn thành đơn hàng');
      alert('Không thể hoàn thành đơn hàng');
    }
  };

  // Auto refresh mỗi 30 giây
  useEffect(() => {
    fetchOrders();
    fetchStats();
    
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchOrders(false);
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [filter]);

  // Render status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: '⏳ Chờ xử lý' },
      preparing: { class: 'status-preparing', label: '🔥 Đang nấu' },
      served: { class: 'status-served', label: '✅ Đã phục vụ' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Render item status badge
  const getItemStatusBadge = (status) => {
    const statusConfig = {
      ordered: { class: 'item-status-ordered', label: 'Đã đặt' },
      preparing: { class: 'item-status-preparing', label: 'Đang nấu' },
      done: { class: 'item-status-done', label: 'Xong' }
    };
    
    const config = statusConfig[status] || statusConfig.ordered;
    return <span className={`item-status-badge ${config.class}`}>{config.label}</span>;
  };

  // FIXED: Logic hiển thị nút Order Actions
  const renderOrderActions = (order) => {
    // Kiểm tra trạng thái các món trong đơn hàng
    const hasOrderedItems = order.items?.some(item => item.status === 'ordered');
    const hasPreparingItems = order.items?.some(item => item.status === 'preparing');
    const allItemsDone = order.items?.every(item => item.status === 'done');
    const orderedItemsCount = order.items?.filter(item => item.status === 'ordered').length || 0;
    const preparingItemsCount = order.items?.filter(item => item.status === 'preparing').length || 0;

    return (
      <div className="order-actions">
        {/* Hiển thị nút "Bắt đầu nấu" chỉ khi có món chưa bắt đầu */}
        {hasOrderedItems && (
          <button
            onClick={() => startCookingOrder(order._id, order.items)}
            className="btn btn-primary"
          >
             Bắt đầu nấu ({orderedItemsCount} món)
          </button>
        )}
        
        {/* Hiển thị nút "Hoàn thành đơn hàng" khi có món đang nấu */}
        {hasPreparingItems && !hasOrderedItems && (
          <button
            onClick={() => completeOrder(order._id, order.items)}
            className="btn btn-success"
          >
            Hoàn thành đơn hàng ({preparingItemsCount} món)
          </button>
        )}

        {/* Thông báo khi tất cả món đã xong */}
        {allItemsDone && order.status === 'served' && (
          <div className="order-completed">
            <span className="completed-badge"> Đã hoàn thành tất cả</span>
          </div>
        )}
        
        {/* Hiển thị cả 2 nút nếu có cả món chưa bắt đầu và đang nấu */}
        {hasOrderedItems && hasPreparingItems && (
          <div className="action-group">
            <button
              onClick={() => completeOrder(order._id, order.items)}
              className="btn btn-success"
            >
               Hoàn thành món đang nấu ({preparingItemsCount})
            </button>
          </div>
        )}
      </div>
    );
  };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="chef-order-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StaffHeader />
      <div className="chef-order-container">
        {/* Header */}
        <div className="chef-header">
          <div className="header-left">
          <h1>🧑‍🍳 Chef – Xem đơn hàng</h1>
          {/* <p>Theo dõi và xử lý đơn hàng • Cập nhật {formatTime(new Date())}</p> */}
          </div>
          
          <button
            onClick={() => {
              setRefreshing(true);
              fetchOrders(false);
              fetchStats();
            }}
            disabled={refreshing}
            className="refresh-btn"
          >
            {refreshing ? '🔄' : '↻'} Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card pending">
            <div className="stat-content">
              <div>
                <p className="stat-label">Chờ xử lý</p>
                <p className="stat-number">{stats.pendingOrders || 0}</p>
              </div>
              <div className="stat-icon">⏳</div>
            </div>
          </div>
          
          <div className="stat-card preparing">
            <div className="stat-content">
              <div>
                <p className="stat-label">Đang nấu</p>
                <p className="stat-number">{stats.preparingOrders || 0}</p>
              </div>
              <div className="stat-icon">🔥</div>
            </div>
          </div>
          
          {/* <div className="stat-card completed">
            <div className="stat-content">
              <div>
                <p className="stat-label">Hoàn thành hôm nay</p>
                <p className="stat-number">{stats.completedToday || 0}</p>
              </div>
              <div className="stat-icon">✅</div>
            </div>
          </div> */}
          
          {/* <div className="stat-card revenue">
            <div className="stat-content">
              <div>
                <p className="stat-label">Doanh thu hôm nay</p>
                <p className="stat-money">{(stats.revenueToday || 0).toLocaleString('vi-VN')}₫</p>
              </div>
              <div className="stat-icon">💰</div>
            </div>
          </div> */}
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ xử lý' },
            { key: 'preparing', label: 'Đang nấu' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* Orders List */}
        <div className="orders-container">
          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">🧑‍🍳</div>
              <p>Không có đơn hàng nào cần xử lý</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="order-card">
                {/* Order Header */}
                <div className="order-header">
                  <div className="order-info">
                    <h3>🍽️ Bàn {
                      order.sessionId?.table?.tableNumber || 
                      order.sessionId?.tableNumber || 
                      order.tableNumber || 
                      'N/A'
                    }</h3>
                    {order.sessionId?.customerName && (
                      <p className="customer-name">👤 {order.sessionId.customerName}</p>
                    )}
                    <div className="order-meta">
                      <span className="order-time">🕒 {formatTime(order.orderTime)}</span>
                      <span className={`waiting-time ${
                        order.waitingTime > 30 ? 'urgent' : 
                        order.waitingTime > 15 ? 'warning' : 'normal'
                      }`}>
                        ⏱️ {order.waitingTime} phút
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-summary">
                    {/*getStatusBadge(order.status) */}
                    <p className="order-total">{order.totalAmount.toLocaleString('vi-VN')}₫</p>
                    <p className="item-count">{order.itemCount || order.items?.length || 0} món</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items">
                  {order.items?.map((item) => (
                    <div key={item._id} className="order-item">
                      <div className="item-info">
                        <h4>{item.quantity}x {item.menuItemId?.name || 'Món ăn'}</h4>
                        <p className="item-details">
                          {/* {item.menuItemId?.category?.name || item.menuItemId?.categoryName || 'Danh mục'} • {item.price.toLocaleString('vi-VN')}₫ */}
                          {item.menuItemId?.category?.name || item.menuItemId?.categoryName || 'Danh mục'} 

                        </p>
                        {item.notes && (
                          <p className="item-notes">📝 {item.notes}</p>
                        )}
                      </div>
                      
                      <div className="item-actions">
                        {getItemStatusBadge(item.status)}
                        
                        <div className="item-buttons">
                          {item.status === 'ordered' && (
                            <button
                              onClick={() => updateItemStatus(item._id, 'preparing')}
                              className="btn btn-start"
                            >
                              Bắt đầu
                            </button>
                          )}
                          {item.status === 'preparing' && (
                            <button
                              onClick={() => updateItemStatus(item._id, 'done')}
                              className="btn btn-done"
                            >
                              Xong
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FIXED: Order Actions với logic chính xác */}
                {renderOrderActions(order)}
                
                {/* Estimated Time */}
                {order.estimatedCompleteTime && order.status === 'preparing' && (
                  <div className="estimated-time">
                    ⏰ Dự kiến xong: {formatTime(order.estimatedCompleteTime)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Order;
