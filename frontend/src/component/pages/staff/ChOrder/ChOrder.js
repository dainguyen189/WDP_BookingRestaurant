import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChefOrder from '../../../Header/StaffHeader';
import OrderHeader from '../OrderHeader';
import OrderStats from '../OrderStats';
import OrderFilters from '../OrderFilters';
import OrderCard from '../OrderCard';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChefHeader from '../../../Header/ChefHeader';

const ChOrder = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [itemSortOption, setItemSortOption] = useState({});
  const [defaultStatus, setDefaultStatus] = useState('preparing');

  const mergeOrdersPreservingEdits = (newOrders, prevOrders) => {
    return newOrders.map(newOrder => {
      const prevOrder = prevOrders.find(o => o._id === newOrder._id);
      if (!prevOrder) return newOrder;

      const mergedItems = newOrder.items.map(newItem => {
        const prevItem = prevOrder.items?.find(i => i._id === newItem._id);
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
      if (filter !== 'all') queryParams.append('status', filter);
      if (dateFilter) queryParams.append('date', dateFilter);
      const response = await axios.get(`http://localhost:8080/api/chef/orders?${queryParams}`);
      const sortedOrders = [...(response.data.orders || [])].sort((a, b) => {
        const aHasPending = a.items.some(item => item.status === 'ordered');
        const bHasPending = b.items.some(item => item.status === 'ordered');
        return (aHasPending === bHasPending) ? 0 : aHasPending ? -1 : 1;
      });

      setOrders(prev => mergeOrdersPreservingEdits(sortedOrders, prev));

    } catch (err) {
      setError('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/chef/dashboard/stats');
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
  }, [filter, dateFilter]);

  const filteredOrders = orders.filter(order =>
    !tableFilter ||
    order.sessionId?.table?.tableNumber?.toLowerCase().includes(tableFilter.toLowerCase())
  );

  return (
    <>
      <ChefHeader />
      <div className="chef-order-container">
        <OrderHeader onRefresh={() => { setRefreshing(true); fetchOrders(false); fetchStats(); }} refreshing={refreshing} />
        <OrderStats stats={stats} />
        <OrderFilters
          tableFilter={tableFilter}
          setTableFilter={setTableFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />

        {error && <div className="error-message">❌ {error}</div>}

        <div className='my-3 mr-3'>
          {['all', 'ordered', 'preparing', 'cooking', 'completed'].map(status => {
            const isActive = defaultStatus === status;
            return (
              <button
                key={status}
                onClick={() => setDefaultStatus(status)}
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

        <div className="orders-container">
          {loading ? (
            <div className="loading"><div className="spinner" />Đang tải...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="no-orders"><div className="no-orders-icon">🧑‍🍳</div><p>Không có đơn hàng</p></div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                itemSortOption={itemSortOption}
                setItemSortOption={setItemSortOption}
                setOrders={setOrders}
                toast={toast}
                fetchOrders={fetchOrders}
                fetchStats={fetchStats}
                defaultStatus={defaultStatus}
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

