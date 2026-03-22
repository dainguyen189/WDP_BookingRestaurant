import axios from 'axios';
import React from 'react';
import OrderItem from './Order.Item';

const OrderCard = ({
  order,
  itemSortOption,
  setItemSortOption,
  setOrders,
  toast,
  fetchOrders,
  fetchStats,
  defaultStatus = 'all'
}) => {
  const filterStatus = itemSortOption[order._id] || defaultStatus;

  const sortItemsByStatus = (items, statusFilter) => {
    if (statusFilter === 'all') return items;
    return items.filter(item => item.status === statusFilter);
  };

  const filteredItems = sortItemsByStatus(order.items || [], filterStatus);

  const handleConfirmItems = async () => {
    const itemsToUpdate = order.items
      .filter(item => item.status === 'ordered')
      .map(item => ({
        id: item._id,
        quantity: item.updatedQuantity ?? item.quantity,
        status: 'preparing'
      }));

    if (itemsToUpdate.length === 0) {
      toast.error('Không có món ăn đang chờ');
      return;
    }

    try {
      console.log(itemsToUpdate)
      await axios.put('http://localhost:8080/api/order-items/', { items: itemsToUpdate });
      toast.success('Đã xác nhận các món ăn');
      fetchOrders(false);
      fetchStats();
    } catch (error) {
      console.log(error)
      toast.error('Lỗi khi xác nhận món ăn');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="shadow" style={{ backgroundColor: '#101010' }}>
      <div className="order-header">
        <div className="order-info">
          <h3>Bàn {order.sessionId?.table?.tableNumber || 'N/A'}</h3>
          {order.sessionId?.customerName && (
            <p className="customer-name">Tên khách: {order.sessionId.customerName}</p>
          )}
          <div className="order-meta">
            <span className="order-time">Vào lúc: {formatTime(order.orderTime)}</span>
            <span className={`waiting-time ${order.waitingTime > 30 ? 'urgent' : order.waitingTime > 15 ? 'warning' : 'normal'}`}>
              Thời gian: {order.waitingTime} phút
            </span>
          </div>
        </div>

        <div className="order-summary">
          <p className="order-total">{order.totalAmount.toLocaleString('vi-VN')}₫</p>
          <p className="item-count">{order.itemCount || order.items?.length || 0} món</p>
        </div>
      </div>

      {/* Sorting Tabs */}
      <div className="item-sorting-tabs" style={{ display: 'flex', gap: '10px', margin: '12px 0 16px', paddingLeft: '12px', flexWrap: 'wrap' }}>
        {['all', 'ordered', 'preparing', 'cooking', 'completed'].map(status => {
          const isActive = filterStatus === status;

          return (
            <button
              key={status}
              onClick={() => setItemSortOption(prev => ({ ...prev, [order._id]: status }))}
              style={{
                backgroundColor: isActive ? '#ff6347' : '#1a1a1a',
                color: isActive ? 'white' : '#ccc',
                border: `1px solid ${isActive ? '#ff6347' : '#333'}`,
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'background-color 0.2s, color 0.2s'
              }}
            >
              {status === 'all' ? 'Tất cả' :
                status === 'ordered' ? 'Chờ' :
                  status === 'preparing' ? 'Đã nhận' :
                    status === 'cooking' ? 'Đang nấu' :
                      'Xong'}
            </button>
          );
        })}
      </div>

      {/* Order Items */}
      <div className="order-items">
        {filteredItems.map((item) => (
          <OrderItem
            key={item._id}
            item={item}
            order={order}
            setOrders={setOrders}
          />
        ))}
      </div>

      {/* Confirm Button */}
      <div className="order-actions">
        <button onClick={handleConfirmItems} className="btn btn-success">
          Xác nhận
        </button>
      </div>

    </div>
  );
};

export default OrderCard;
