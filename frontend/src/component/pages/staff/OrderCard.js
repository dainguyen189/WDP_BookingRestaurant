import axios from 'axios';
import React from 'react';
import OrderItem from './Order.Item';
import {
  formatWaitingDisplay,
  waitingTimeClass,
} from '../../../utils/waitingTimeFormat';

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
    if (statusFilter === 'completed') {
      return items.filter((item) => item.status === 'done');
    }
    return items.filter((item) => item.status === statusFilter);
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
      await axios.put('http://localhost:8080/api/order-items/', { items: itemsToUpdate });
      toast.success('Đã xác nhận các món ăn');
      fetchOrders(false);
      fetchStats();
    } catch (error) {
      toast.error('Lỗi khi xác nhận món ăn');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const waitClass = waitingTimeClass(order.waitingTime);
  const waitLabel = formatWaitingDisplay(order.waitingTime);

  return (
    <div className="chef-order-card shadow-sm">
      <div className="order-header">
        <div className="order-info">
          <h3>Bàn {order.sessionId?.table?.tableNumber || "N/A"}</h3>
          {order.sessionId?.customerName && (
            <p className="customer-name">
              Tên khách: {order.sessionId.customerName}
            </p>
          )}
          <div className="order-meta chef-order-meta">
            <span className="order-time">
              Vào lúc: {formatTime(order.orderTime)}
            </span>
            <span className={`waiting-time ${waitClass}`}>
              Đã chờ: {waitLabel}
            </span>
          </div>
        </div>

        <div className="order-summary">
          <p className="order-total">
            {order.totalAmount.toLocaleString("vi-VN")}₫
          </p>
          <p className="item-count">
            {order.itemCount || order.items?.length || 0} món
          </p>
        </div>
      </div>

      <div className="chef-order-inner-tabs">
        {["all", "ordered", "preparing", "cooking", "completed"].map((status) => {
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              type="button"
              className={`staff-item-status-tab${isActive ? " staff-item-status-tab--active" : ""}`}
              onClick={() =>
                setItemSortOption((prev) => ({ ...prev, [order._id]: status }))
              }
            >
              {status === "all"
                ? "Tất cả"
                : status === "ordered"
                  ? "Chờ"
                  : status === "preparing"
                    ? "Đã nhận"
                    : status === "cooking"
                      ? "Đang nấu"
                      : "Xong"}
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
