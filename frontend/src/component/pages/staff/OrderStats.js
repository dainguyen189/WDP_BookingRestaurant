const OrderStats = ({ stats }) => (
  <div className="stats-grid stats-grid--modern">
    <div className="stat-card stat-card--modern pending">
      <div className="stat-content">
        <div className="stat-text">
          <p className="stat-label">Chờ xử lý</p>
          <p className="stat-number">{stats.pendingOrders ?? 0}</p>
        </div>
        <div className="stat-icon-badge stat-icon-badge--amber" aria-hidden>
          ⏳
        </div>
      </div>
    </div>
    <div className="stat-card stat-card--modern preparing">
      <div className="stat-content">
        <div className="stat-text">
          <p className="stat-label">Đang chuẩn bị</p>
          <p className="stat-number">{stats.preparingOrders ?? 0}</p>
        </div>
        <div className="stat-icon-badge stat-icon-badge--emerald" aria-hidden>
          🔥
        </div>
      </div>
    </div>
  </div>
);

export default OrderStats;
