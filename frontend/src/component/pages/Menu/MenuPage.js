import React, { useEffect, useState } from "react";
import axios from "axios";

import Header from "../../Header/Header";
import MenuItemCard from "./MenuItemCard";

import { useOrder } from "../../../context/OrderContext";
import { useSession } from "../../../context/SessionContext";
import { useSearchParams } from "react-router-dom";

import "./css/MenuPage.css";

function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionValid, setSessionValid] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [order, setOrder] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const itemsPerPage = 12;

  const { loadCartFromServer, setOrderId } = useOrder();
  const { sessionId, saveSession } = useSession();
  const [searchParams] = useSearchParams();

  // 🧾 Gán sessionId từ URL hoặc localStorage
  useEffect(() => {
    const idFromUrl = searchParams.get("sessionId");
    if (idFromUrl) {
      saveSession(idFromUrl);
      localStorage.setItem("sessionId", idFromUrl);
      console.log("🔐 Đã lưu sessionId:", idFromUrl);
    } else {
      const stored = localStorage.getItem("sessionId");
      if (stored) {
        saveSession(stored);
        console.log("💾 Khôi phục từ localStorage:", stored);
      } else {
        alert("❌ Không tìm thấy sessionId! Vui lòng quét mã QR hoặc chọn bàn.");
        setSessionValid(false);
      }
    }
  }, []);

  // 🧭 Kiểm tra session còn active
  useEffect(() => {
    const validateSession = async () => {
      if (!sessionId) return;
      try {
        const res = await axios.get(`http://localhost:8080/api/dining-sessions/${sessionId}`);
        if (res.data.status !== "active") throw new Error("Session không còn active");
        setSessionValid(true);
      } catch (err) {
        console.error("Session ID không hợp lệ hoặc không còn active:", err);
        setSessionValid(false);
      }
    };
    validateSession();
  }, [sessionId]);

  // 📦 Tải dữ liệu menu, category và order
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, menuRes] = await Promise.all([
          axios.get("http://localhost:8080/api/menu-categories"),
          axios.get("http://localhost:8080/api/menu-items")
        ]);

        // ⚡ Lọc bỏ item lỗi (thiếu name)
        const validMenuItems = menuRes.data.filter(item => item && item.name);

        setCategories(categoriesRes.data);
        setMenuItems(validMenuItems);

        // 🛒 Lấy order (nếu có)
        try {
          const orderRes = await axios.get(`http://localhost:8080/api/orders/session/${sessionId}`);
          const currentOrder = orderRes.data[0];
          if (currentOrder) {
            setOrder(currentOrder);
            setOrderId(currentOrder._id);

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

            loadCartFromServer(formattedItems);
          } else {
            console.log("📭 Chưa có đơn hàng nào cho phiên này.");
          }
        } catch (orderErr) {
          if (orderErr.response?.status === 404) {
            console.log("📭 Chưa có đơn hàng nào cho phiên này.");
          } else {
            console.error("❌ Lỗi khi lấy đơn hàng:", orderErr);
          }
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải dữ liệu menu hoặc danh mục:", err);
      }
    };

    if (sessionValid) fetchData();
  }, [sessionValid]);

  if (sessionValid === null) return <p>🔍 Đang kiểm tra phiên ăn uống...</p>;
  if (sessionValid === false) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ color: "red" }}>❌ Phiên không hợp lệ hoặc đã kết thúc</h2>
        <p>Vui lòng quét lại mã QR hoặc chọn lại bàn để bắt đầu phiên mới.</p>
      </div>
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
      <div className="menu-page-container">
        <h4>
          {order?.sessionId?.customerName
            ? `Khách hàng: ${order.sessionId.customerName}`
            : ""}
        </h4>
        <h2>Menu</h2>

        {/* 🔍 Ô tìm kiếm */}
        <input
          type="text"
          placeholder="Tìm món ăn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "300px",
            height: "40px",
            fontSize: "16px",
            margin: "20px auto",
            display: "block",
            border: "2px solid blue",
            zIndex: 1000,
            position: "relative",
            backgroundColor: "#fff",
            color: "#000",
          }}
        />

        {/* 🏷️ Danh sách danh mục */}
        <div className="category-list">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setCurrentPage(1);
            }}
            className={!selectedCategory ? "active" : ""}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
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

        {/* 🧾 Danh sách món ăn */}
        <div className="menu-grid">
          {currentItems.map((item) => (
            <MenuItemCard key={item._id} item={item} />
          ))}
        </div>

        {/* 📌 Phân trang */}
        <div className="pagination">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default MenuPage;
