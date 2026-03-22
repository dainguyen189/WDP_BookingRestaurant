const OrderHeader = ({ onRefresh, refreshing }) => (
  <div className="chef-header">
    <div className="header-left">
      <h1>🧑‍🍳 Chef – Xem đơn hàng</h1>
    </div>
    <button onClick={onRefresh} disabled={refreshing} className="refresh-btn">
      {refreshing ? '🔄' : '↻'} Refresh
    </button>
  </div>
);
export default OrderHeader;
