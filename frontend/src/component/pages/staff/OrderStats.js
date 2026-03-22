const OrderStats = ({ stats }) => (
  <div className="stats-grid">
    <div className="stat-card pending">
      <div className="stat-content">
        <p className="stat-label">Chờ xử lý</p>
        <p className="stat-number">{stats.pendingOrders || 0}</p>
        <div className="stat-icon">⏳</div>
      </div>
    </div>
    <div className="stat-card preparing">
      <div className="stat-content">
        <p className="stat-label">Đang nấu</p>
        <p className="stat-number">{stats.preparingOrders || 0}</p>
        <div className="stat-icon">🔥</div>
      </div>
    </div>
  </div>
);
export default OrderStats;
