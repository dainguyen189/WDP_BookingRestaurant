import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../../Chef/css/ChefOrder.css';
import OrderHeader from '../OrderHeader';
import OrderStats from '../OrderStats';
import OrderFilters from '../OrderFilters';
import OrderCard from '../OrderCard';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChefHeader from '../../../Header/ChefHeader';

/** Đơn có ít nhất một món khớp tab (lọc danh sách đơn). */
function orderMatchesItemTab(order, tab) {
  const items = order.items || [];
  if (tab === 'all') return true;
  if (items.length === 0) return false;
  if (tab === 'completed') return items.some((i) => i.status === 'done');
  return items.some((i) => i.status === tab);
}

function getOrderSortTimeMs(order) {
  const tryParse = (v) => {
    if (v == null) return null;
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? null : t;
  };
  return (
    tryParse(order.orderTime) ??
    tryParse(order.updatedAt) ??
    0
  );
}

const ITEM_TAB_KEYS = ['all', 'ordered', 'preparing', 'cooking', 'completed'];

const ChOrder = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [itemSortOption, setItemSortOption] = useState({});
  /** Một state: lọc đơn theo trạng thái món + tab mặc định trong từng thẻ */
  const [itemViewFilter, setItemViewFilter] = useState('all');

  const mergeOrdersPreservingEdits = (newOrders, prevOrders) => {
    return newOrders.map((newOrder) => {
      const prevOrder = prevOrders.find((o) => o._id === newOrder._id);
      if (!prevOrder) return newOrder;

      const mergedItems = newOrder.items.map((newItem) => {
        const prevItem = prevOrder.items?.find((i) => i._id === newItem._id);
        return prevItem?.updatedQuantity !== undefined
          ? { ...newItem, updatedQuantity: prevItem.updatedQuantity }
          : newItem;
      });

      return { ...newOrder, items: mergedItems };
    });
  };

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const queryParams = new URLSearchParams();
      if (dateFilter) queryParams.append('date', dateFilter);
      const response = await axios.get(
        `http://localhost:8080/api/chef/orders?${queryParams}`,
      );
      const raw = response.data.orders || [];
      const sorted = [...raw].sort(
        (a, b) => getOrderSortTimeMs(b) - getOrderSortTimeMs(a),
      );

      setOrders((prev) => mergeOrdersPreservingEdits(sorted, prev));
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/chef/dashboard/stats',
      );
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchOrders(false);
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const visibleOrders = useMemo(() => {
    const q = tableFilter.trim().toLowerCase();
    return orders
      .filter(
        (order) =>
          !q ||
          String(order.sessionId?.table?.tableNumber ?? '')
            .toLowerCase()
            .includes(q),
      )
      .filter((order) => orderMatchesItemTab(order, itemViewFilter))
      .sort((a, b) => getOrderSortTimeMs(b) - getOrderSortTimeMs(a));
  }, [orders, tableFilter, itemViewFilter]);

  return (
    <>
      <ChefHeader />
      <div className="chef-order-container chef-orders-page">
        <OrderHeader
          variant="chef"
          onRefresh={() => {
            setRefreshing(true);
            fetchOrders(false);
            fetchStats();
          }}
          refreshing={refreshing}
        />
        <OrderStats stats={stats} />

        <section className="chef-orders-panel" aria-label="Lọc đơn hàng">
          <h2 className="chef-orders-panel-title">Lọc nhanh</h2>
          <OrderFilters
            tableFilter={tableFilter}
            setTableFilter={setTableFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
          <div className="chef-orders-panel-divider" aria-hidden />
          <p className="chef-list-filter-label">Trạng thái món trong đơn</p>
          <p className="chef-orders-panel-hint">
            Chỉ hiện đơn có ít nhất một món khớp; tab trong từng thẻ đồng bộ với lựa chọn này.
          </p>
          <div className="staff-item-status-tabs chef-orders-status-tabs">
            {ITEM_TAB_KEYS.map((status) => {
              const isActive = itemViewFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  className={`staff-item-status-tab${isActive ? " staff-item-status-tab--active" : ""}`}
                  onClick={() => setItemViewFilter(status)}
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
        </section>

        {error && (
          <div className="error-message chef-orders-error" role="alert">
            {error}
          </div>
        )}

        <div className="orders-container chef-orders-list">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              Đang tải...
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">🧑‍🍳</div>
              <p>Không có đơn hàng phù hợp</p>
            </div>
          ) : (
            visibleOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                itemSortOption={itemSortOption}
                setItemSortOption={setItemSortOption}
                setOrders={setOrders}
                toast={toast}
                fetchOrders={fetchOrders}
                fetchStats={fetchStats}
                defaultStatus={itemViewFilter}
              />
            ))
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default ChOrder;
