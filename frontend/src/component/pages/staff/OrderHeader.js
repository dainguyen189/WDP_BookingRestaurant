const OrderHeader = ({ onRefresh, refreshing, variant = "staff" }) => {
  const isChef = variant === "chef";
  return (
    <header className={`chef-header${isChef ? " chef-header--chef-orders" : ""}`}>
      <div className="header-left">
        {isChef ? (
          <>
            <p className="chef-header-kicker">Bếp · Theo dõi đơn</p>
            <h1 className="chef-header-title-main">Đơn hàng</h1>
            <p className="chef-header-desc">
              Lọc theo bàn, ngày và trạng thái món — đơn mới nhất hiển thị trên cùng.
            </p>
          </>
        ) : (
          <>
            <h1>📋 Quản lý đơn hàng</h1>
            <p className="header-left-sub">Theo dõi đơn từ khách và cập nhật trạng thái món.</p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="refresh-btn"
      >
        <span className="refresh-btn-icon" aria-hidden>
          {refreshing ? "…" : "↻"}
        </span>
        {refreshing ? "Đang cập nhật…" : "Làm mới"}
      </button>
    </header>
  );
};

export default OrderHeader;
