import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

import Header from "../../Header/Header";
import MenuItemCard from "./MenuItemCard";

import { useOrder } from "../../../context/OrderContext";
import { useSession } from "../../../context/SessionContext";
import { useSearchParams } from "react-router-dom";

import "./css/MenuPage.css";

/** loading | menu | session-bad */
function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewState, setViewState] = useState("loading");
  const [hasSession, setHasSession] = useState(false);
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

  // Save sessionId from URL to context/localStorage only if present in URL
  useEffect(() => {
    const idFromUrl = searchParams.get("sessionId");
    if (idFromUrl) {
      saveSession(idFromUrl);
      localStorage.setItem("sessionId", idFromUrl);
    }
  }, [searchParams, saveSession]);

  // Session validation logic:
  // - No sessionId anywhere → guest, show menu freely
  // - sessionId from localStorage only (stale) → guest, show menu freely (don't validate)
  // - sessionId from URL → validate; show session-bad only if invalid
  useEffect(() => {
    const idFromUrl = searchParams.get("sessionId");

    if (!idFromUrl) {
      // No URL session param — guest browsing (ignore any stale localStorage value)
      setHasSession(false);
      setViewState("menu");
      return;
    }

    // URL has a sessionId — must validate it
    setHasSession(true);
    if (!sessionId) return;

    let cancelled = false;
    const validateSession = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/dining-sessions/${sessionId}`,
        );
        if (cancelled) return;
        if (res.data.status !== "active") {
          throw new Error("Session không còn active");
        }
        setViewState("menu");
      } catch (err) {
        if (!cancelled) {
          console.error("Session ID không hợp lệ hoặc không còn active:", err);
          // Clear bad session so it doesn't interfere with future visits
          localStorage.removeItem("sessionId");
          setViewState("session-bad");
        }
      }
    };

    validateSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId, searchParams]);

  // Load menu; sync cart/order only when there is a valid session
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, menuRes] = await Promise.all([
          axios.get("http://localhost:8080/api/menu-categories"),
          axios.get("http://localhost:8080/api/menu-items"),
        ]);

        const validMenuItems = menuRes.data.filter((item) => item && item.name);

        setCategories(categoriesRes.data);
        setMenuItems(validMenuItems);

        if (hasSession && sessionId) {
          try {
            const orderRes = await axios.get(
              `http://localhost:8080/api/orders/session/${sessionId}`,
            );
            const currentOrder = orderRes.data[0];
            if (currentOrder) {
              setOrder(currentOrder);
              setOrderIdRef.current(currentOrder._id);

              const itemsRes = await axios.get(
                `http://localhost:8080/api/order-items/order/${currentOrder._id}`,
              );

              const formattedItems = itemsRes.data.map((item) => ({
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
  }, [viewState, sessionId, hasSession]);

  if (viewState === "loading") {
    return (
      <>
        <Header />
        <p className="px-3 py-4 text-center">Đang kiểm tra phiên ăn uống...</p>
      </>
    );
  }

  if (viewState === "session-bad") {
    return (
      <>
        <Header />
        <div className="px-3 py-4" style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 className="h4 text-danger mb-2">
            Phiên không hợp lệ hoặc đã kết thúc
          </h2>
          <p className="mb-0">
            Vui lòng quét lại mã QR hoặc chọn lại bàn để bắt đầu phiên mới.
          </p>
        </div>
      </>
    );
  }

  // Filter by category + search
  const filteredMenuItems = menuItems
    .filter(
      (item) => !selectedCategory || item.category?._id === selectedCategory,
    )
    .filter((item) => {
      const name = item?.name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Pagination
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

          {!sessionId && (
            <div className="menu-page-banner" role="status">
              Bạn đang xem menu. Để gọi món gắn với bàn, hãy quét mã QR tại bàn.
            </div>
          )}

          <div className="menu-search-row">
            <label className="menu-search-wrap" htmlFor="menu-search-input">
              <FontAwesomeIcon
                icon={faSearch}
                className="menu-search-icon"
                aria-hidden
              />
              <input
                id="menu-search-input"
                type="search"
                className="menu-search-input"
                placeholder="Tìm món ăn theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              {categories.map((cat) => (
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
              <p className="menu-empty-hint">
                Không có món nào phù hợp. Thử từ khóa khác nhé.
              </p>
            ) : (
              currentItems.map((item) => (
                <MenuItemCard key={item._id} item={item} hasSession={!!sessionId} />
              ))
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
