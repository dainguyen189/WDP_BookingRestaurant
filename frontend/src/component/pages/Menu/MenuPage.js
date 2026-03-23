import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

import Header from "../../Header/Header";
import MenuItemCard from "./MenuItemCard";

import { useOrder } from "../../../context/OrderContext";
import { useSession } from "../../../context/SessionContext";
import { Link, useSearchParams } from "react-router-dom";

import "./css/MenuPage.css";

/** loading | menu | session-bad | need-auth */
function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewState, setViewState] = useState("loading");
  const [browseWithoutTable, setBrowseWithoutTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [order, setOrder] = useState({});

  const itemsPerPage = 12;

  const { loadCartFromServer, setOrderId } = useOrder();
  const { sessionId, saveSession } = useSession();
  const [searchParams] = useSearchParams();

  const loadCartRef = useRef(loadCartFromServer);
  const setOrderIdRef = useRef(setOrderId);
  loadCartRef.current = loadCartFromServer;
  setOrderIdRef.current = setOrderId;

  const isLoggedIn = () =>
    Boolean(localStorage.getItem("token") && localStorage.getItem("user"));

  // Gán sessionId từ URL / localStorage; nếu không có phiên bàn thì cho khách đã đăng nhập xem menu
  useEffect(() => {
    const idFromUrl = searchParams.get("sessionId");
    if (idFromUrl) {
      saveSession(idFromUrl);
      localStorage.setItem("sessionId", idFromUrl);
      setBrowseWithoutTable(false);
      return;
    }
    const stored = localStorage.getItem("sessionId");
    if (stored) {
      saveSession(stored);
      setBrowseWithoutTable(false);
      return;
    }

    setBrowseWithoutTable(true);
    if (isLoggedIn()) {
      setViewState("menu");
    } else {
      setViewState("need-auth");
    }
  }, [searchParams, saveSession]);

  // Chỉ kiểm tra API khi có phiên bàn (QR / chọn bàn)
  useEffect(() => {
    if (browseWithoutTable) return;

    const idFromUrl = searchParams.get("sessionId");
    const stored = idFromUrl || localStorage.getItem("sessionId");
    if (!stored) return;
    if (!sessionId) return;

    let cancelled = false;
    const validateSession = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/dining-sessions/${sessionId}`
        );
        if (cancelled) return;
        if (res.data.status !== "active") {
          throw new Error("Session không còn active");
        }
        setViewState("menu");
      } catch (err) {
        if (!cancelled) {
          console.error("Session ID không hợp lệ hoặc không còn active:", err);
          setViewState("session-bad");
        }
      }
    };
    validateSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId, searchParams, browseWithoutTable]);

  // Tải menu; chỉ đồng bộ giỏ / đơn khi có phiên bàn hợp lệ
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, menuRes] = await Promise.all([
          axios.get("http://localhost:8080/api/menu-categories"),
          axios.get("http://localhost:8080/api/menu-items"),
        ]);

        const validMenuItems = menuRes.data.filter(item => item && item.name);

        setCategories(categoriesRes.data);
        setMenuItems(validMenuItems);

        if (!browseWithoutTable && sessionId) {
          try {
            const orderRes = await axios.get(
              `http://localhost:8080/api/orders/session/${sessionId}`
            );
            const currentOrder = orderRes.data[0];
            if (currentOrder) {
              setOrder(currentOrder);
              setOrderIdRef.current(currentOrder._id);

              const itemsRes = await axios.get(
                `http://localhost:8080/api/order-items/order/${currentOrder._id}`
              );

              const formattedItems = itemsRes.data.map(item => ({
                _id: item.menuItemId,
                name: item.menuItem?.name || "Không rõ",
                price: item.price,
                quantity: item.quantity,
                notes: item.notes || "",
              }));

              loadCartRef.current(formattedItems);
            }
          } catch (orderErr) {
            if (orderErr.response?.status === 404) {
              console.log("📭 Chưa có đơn hàng nào cho phiên này.");
            } else {
              console.error("❌ Lỗi khi lấy đơn hàng:", orderErr);
            }
          }
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu menu hoặc danh mục:", err);
      }
    };

    if (viewState === "menu") fetchData();
  }, [viewState, sessionId, browseWithoutTable]);

  if (viewState === "loading") {
    return (
      <>
        <Header />
        <p className="px-3 py-4 text-center">Đang kiểm tra phiên ăn uống...</p>
      </>
    );
  }

  if (viewState === "need-auth") {
    return (
      <>
        <Header />
        <div className="px-3 py-5 text-center" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2 className="h4 mb-3">Cần đăng nhập hoặc quét mã tại bàn</h2>
          <p className="text-muted mb-4">
            Để xem menu khi chưa có mã QR bàn, vui lòng đăng nhập. Nếu bạn đang tại nhà hàng, hãy quét mã QR
            trên bàn để gọi món theo phiên.
          </p>
          <Link to="/login" className="btn btn-success me-2">
            Đăng nhập
          </Link>
          <Link to="/home" className="btn btn-outline-secondary">
            Về trang chủ
          </Link>
        </div>
      </>
    );
  }

  if (viewState === "session-bad") {
    return (
      <>
        <Header />
        <div className="px-3 py-4" style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 className="h4 text-danger mb-2">Phiên không hợp lệ hoặc đã kết thúc</h2>
          <p className="mb-0">
            Vui lòng quét lại mã QR hoặc chọn lại bàn để bắt đầu phiên mới.
          </p>
        </div>
      </>
    );
  }

  // 🪄 Lọc theo danh mục + tìm kiếm (đã fix lỗi toLowerCase)
  const filteredMenuItems = menuItems
    .filter(item => !selectedCategory || item.category?._id === selectedCategory)
    .filter(item => {
      const name = item?.name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // 📑 Phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMenuItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);

  return (
    <>
      <Header />
      <main className="menu-page-shell">
        <div className="menu-page-container">
          <header className="menu-page-header">
            {order?.sessionId?.customerName ? (
              <p className="menu-page-guest-badge">
                Khách: <strong>{order.sessionId.customerName}</strong>
              </p>
            ) : null}
            <h1 className="menu-page-title">Thực đơn</h1>
            <p className="menu-page-lead">
              Chọn món yêu thích — giao diện được cập nhật theo từng mùa
            </p>
          </header>

          {browseWithoutTable && (
            <div className="menu-page-banner" role="status">
              Bạn đang xem menu. Để gọi món gắn với bàn, hãy quét mã QR tại bàn.
            </div>
          )}

          <div className="menu-search-row">
            <label className="menu-search-wrap" htmlFor="menu-search-input">
              <FontAwesomeIcon icon={faSearch} className="menu-search-icon" aria-hidden />
              <input
                id="menu-search-input"
                type="search"
                className="menu-search-input"
                placeholder="Tìm món ăn theo tên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="category-list-scroll">
            <div className="category-list">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setCurrentPage(1);
                }}
                className={!selectedCategory ? "active" : ""}
              >
                Tất cả
              </button>
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat._id}
                  onClick={() => {
                    setSelectedCategory(cat._id);
                    setCurrentPage(1);
                  }}
                  className={selectedCategory === cat._id ? "active" : ""}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-grid">
            {currentItems.length === 0 ? (
              <p className="menu-empty-hint">Không có món nào phù hợp. Thử từ khóa khác nhé.</p>
            ) : (
              currentItems.map(item => <MenuItemCard key={item._id} item={item} />)
            )}
          </div>

          {totalPages > 1 && (
            <nav className="menu-pagination" aria-label="Phân trang menu">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={currentPage === i + 1 ? "active" : ""}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          )}
        </div>
      </main>
    </>
  );
}

export default MenuPage;
