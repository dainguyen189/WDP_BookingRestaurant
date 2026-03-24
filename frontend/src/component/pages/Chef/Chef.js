import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/ChefOrder.css";
import ChefHeader from "../../Header/ChefHeader";
import "./css/Chef.css";
import { Row, Col, Form } from "react-bootstrap";

const Chef = () => {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "preparing",
    tableNumber: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filter.date) params.append("date", filter.date);
      if (filter.tableNumber) params.append("tableNumber", filter.tableNumber);
      if (filter.status && filter.status !== "all")
        params.append("status", filter.status);

      const response = await axios.get(
        `http://localhost:8080/api/order-items/chef?${params}`,
      );
      setOrderItems(response.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/chef/dashboard/stats",
      );
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
    fetchStats();
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      setError("");
      await axios.put(
        `http://localhost:8080/api/chef/order-items/${itemId}/status`,
        { status: newStatus },
      );
      fetchOrders(false);
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("Không thể cập nhật trạng thái món ăn");
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchOrders();
      fetchStats();
    }, 300);
    return () => clearTimeout(timeout);
  }, [filter]);

  const getItemStatusBadge = (status) => {
    const config = {
      ordered: { class: "chef-dash-badge chef-dash-badge--ordered", label: "Chưa xử lý" },
      preparing: { class: "chef-dash-badge chef-dash-badge--preparing", label: "Đã nhận" },
      cooking: { class: "chef-dash-badge chef-dash-badge--cooking", label: "Đang nấu" },
      done: { class: "chef-dash-badge chef-dash-badge--done", label: "Xong" },
    }[status] || { class: "chef-dash-badge", label: status };
    return <span className={config.class}>{config.label}</span>;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} · ${day}/${month}/${year}`;
  };

  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "ordered", label: "Chưa xử lý" },
    { value: "preparing", label: "Đã nhận" },
    { value: "cooking", label: "Đang nấu" },
    { value: "done", label: "Xong" },
  ];

  return (
    <>
      <ChefHeader />
      <div className="chef-order-container chef-main-dashboard">
        <header className="chef-dash-hero">
          <div className="chef-dash-hero-text">
            <p className="chef-dash-kicker">Bếp · Theo dõi món</p>
            <h1 className="chef-dash-title">Xem đơn hàng</h1>
            <p className="chef-dash-lead">
              Lọc theo ngày, số bàn và trạng thái để xử lý món kịp thời.
            </p>
          </div>
          <button
            type="button"
            className="chef-dash-refresh"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            {refreshing ? "Đang cập nhật…" : "Làm mới"}
          </button>
        </header>

        <div className="chef-dash-stats">
          <div className="chef-dash-stat chef-dash-stat--pending">
            <div>
              <p className="chef-dash-stat-label">Đơn chờ xử lý</p>
              <p className="chef-dash-stat-num">{stats.pendingOrders ?? 0}</p>
            </div>
            <span className="chef-dash-stat-ico" aria-hidden>
              ⏳
            </span>
          </div>
          <div className="chef-dash-stat chef-dash-stat--prep">
            <div>
              <p className="chef-dash-stat-label">Đang chuẩn bị</p>
              <p className="chef-dash-stat-num">{stats.preparingOrders ?? 0}</p>
            </div>
            <span className="chef-dash-stat-ico" aria-hidden>
              🔥
            </span>
          </div>
        </div>

        <section className="chef-dash-filters-card" aria-label="Bộ lọc">
          <Row className="g-3 chef-dash-filter-row">
            <Col md={4} lg={3}>
              <Form.Label className="chef-dash-field-label">Ngày</Form.Label>
              <Form.Control
                type="date"
                className="chef-dash-input"
                value={filter.date}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </Col>
            <Col md={4} lg={3}>
              <Form.Label className="chef-dash-field-label">Số bàn</Form.Label>
              <Form.Control
                type="text"
                className="chef-dash-input"
                placeholder="Ví dụ: A1"
                value={filter.tableNumber}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    tableNumber: e.target.value,
                  }))
                }
              />
            </Col>
          </Row>
          <p className="chef-dash-tabs-label">Trạng thái món</p>
          <div className="chef-dash-status-tabs" role="tablist">
            {statusOptions.map((option) => {
              const active = filter.status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`chef-dash-tab${active ? " chef-dash-tab--active" : ""}`}
                  onClick={() =>
                    setFilter((prev) => ({ ...prev, status: option.value }))
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <div className="chef-dash-alert" role="alert">
            {error}
          </div>
        )}

        <div className="chef-dash-list-shell">
          {loading ? (
            <div className="loading chef-dash-loading">
              <div className="spinner" />
              <p>Đang tải dữ liệu…</p>
            </div>
          ) : orderItems.length === 0 ? (
            <div className="chef-dash-empty">
              <div className="chef-dash-empty-icon" aria-hidden>
                🍽️
              </div>
              <h2 className="chef-dash-empty-title">Không có món nào</h2>
              <p className="chef-dash-empty-text">
                Thử đổi ngày, bàn hoặc trạng thái lọc — hoặc bấm{" "}
                <strong>Làm mới</strong> sau khi có đơn mới.
              </p>
            </div>
          ) : (
            <ul className="chef-dash-item-list">
              {orderItems.map((item) => {
                const table = item?.table || "—";
                return (
                  <li key={item._id} className="chef-dash-item-card">
                    <div className="chef-dash-item-top">
                      <div className="chef-dash-item-title-block">
                        <h2 className="chef-dash-item-name">
                          {item.quantity} × {item.name || "Món không xác định"}
                        </h2>
                        <div className="chef-dash-item-meta">
                          <span className="chef-dash-item-table">
                            Bàn <strong>{table}</strong>
                          </span>
                          <span className="chef-dash-item-dot" aria-hidden>
                            ·
                          </span>
                          <span>{item.customerName || "Khách"}</span>
                          <span className="chef-dash-item-dot" aria-hidden>
                            ·
                          </span>
                          <time className="chef-dash-item-time">
                            {item?.orderTime
                              ? formatTime(item.orderTime)
                              : "—"}
                          </time>
                        </div>
                      </div>
                      {getItemStatusBadge(item.status)}
                    </div>
                    <div className="chef-dash-item-actions">
                      {item.status === "preparing" && (
                        <button
                          type="button"
                          className="chef-dash-btn chef-dash-btn--primary"
                          onClick={() => updateItemStatus(item._id, "cooking")}
                        >
                          Bắt đầu nấu
                        </button>
                      )}
                      {item.status === "cooking" && (
                        <>
                          <button
                            type="button"
                            className="chef-dash-btn chef-dash-btn--ghost"
                            onClick={() =>
                              updateItemStatus(item._id, "preparing")
                            }
                          >
                            Chưa nấu
                          </button>
                          <button
                            type="button"
                            className="chef-dash-btn chef-dash-btn--success"
                            onClick={() => updateItemStatus(item._id, "done")}
                          >
                            Hoàn thành
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Chef;
