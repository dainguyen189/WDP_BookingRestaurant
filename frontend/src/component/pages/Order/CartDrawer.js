import React, { useState } from "react";
import { useOrder } from "../../../context/OrderContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSession } from "../../../context/SessionContext";
import "./css/CartDrawer.css";

function CartItem({
  item,
  increaseQuantity,
  decreaseQuantity,
  updateNote,
  removeFromCart,
}) {
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <li className={`cart-item ${noteOpen ? "cart-item--note-open" : ""}`}>
      <div className="cart-item-top">
        <span className="cart-item-name" title={item.name}>
          {item.name}
        </span>
        <span className="cart-item-line-total">
          {(item.price * item.quantity).toLocaleString()}₫
        </span>
      </div>

      <div className="cart-item-row">
        <div className="quantity-control" role="group" aria-label="Số lượng">
          <button
            type="button"
            className="qty-btn"
            onClick={() => decreaseQuantity(item._id)}
            aria-label="Giảm"
          >
            −
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button
            type="button"
            className="qty-btn"
            onClick={() => increaseQuantity(item._id)}
            aria-label="Tăng"
          >
            +
          </button>
        </div>

        <div className="cart-item-actions">
          <button
            type="button"
            className="cart-chip cart-chip--ghost"
            onClick={() => setNoteOpen(!noteOpen)}
          >
            {noteOpen ? "Ẩn ghi chú" : "Ghi chú"}
          </button>
          <button
            type="button"
            className="cart-chip cart-chip--danger"
            onClick={() => removeFromCart(item._id)}
          >
            Xóa
          </button>
        </div>
      </div>

      {noteOpen ? (
        <input
          type="text"
          className="cart-item-note-input"
          placeholder="Ghi chú cho món này…"
          value={item.notes || ""}
          onChange={(e) => updateNote(item._id, e.target.value)}
        />
      ) : null}
    </li>
  );
}

function CartDrawer({ isOpen, onClose }) {
  const { sessionId } = useSession();
  const {
    cartItems,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    updateNote,
    removeFromCart,
    setOrderId,
  } = useOrder();
  const navigate = useNavigate();

  const handleSendOrder = async () => {
    if (!sessionId) {
      alert("⚠️ No session! Please select or create a table before ordering.");
      return;
    }

    if (cartItems.length === 0) {
      alert("⚠️ Your cart is empty.");
      return;
    }

    const orderData = {
      sessionId,
      items: cartItems.map((item) => ({
        menuItemId: item._id,
        quantity: item.quantity,
        notes: item.notes || "",
        price: item.price,
      })),
    };

    try {
      const res = await axios.post("http://localhost:8080/api/orders", orderData);
      setOrderId(res.data._id);
      alert(" Order has been sent to admin!");
      clearCart();
      onClose();
      navigate("/checkout");
    } catch (err) {
      console.error("❌ Order sending error:", err.response?.data || err.message);
      alert("❌ Failed to send order!");
    }
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className={`cart-drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
      <header className="cart-drawer-header">
        <div className="cart-drawer-header-text">
          <h2 className="cart-drawer-title">Giỏ hàng</h2>
          <p className="cart-drawer-sub">
            {cartItems.length === 0
              ? "Chưa có món"
              : `${cartItems.length} món đã chọn`}
          </p>
        </div>
        <button
          type="button"
          className="cart-drawer-close"
          onClick={onClose}
          aria-label="Đóng giỏ hàng"
        >
          Đóng
        </button>
      </header>

      <div className="cart-drawer-body">
        {cartItems.length === 0 ? (
          <p className="cart-drawer-empty">Giỏ hàng trống — hãy chọn món từ thực đơn.</p>
        ) : (
          <ul className="cart-drawer-list">
            {cartItems.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                increaseQuantity={increaseQuantity}
                decreaseQuantity={decreaseQuantity}
                updateNote={updateNote}
                removeFromCart={removeFromCart}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="cart-drawer-footer">
        <div className="cart-drawer-total-row">
          <span className="cart-drawer-total-label">Tổng cộng</span>
          <span className="cart-drawer-total-value">{total.toLocaleString()}₫</span>
        </div>
        <button type="button" className="cart-drawer-btn cart-drawer-btn--primary" onClick={handleSendOrder}>
          Gửi đơn
        </button>
        <button
          type="button"
          className="cart-drawer-btn cart-drawer-btn--secondary"
          onClick={clearCart}
          disabled={cartItems.length === 0}
        >
          Xóa giỏ
        </button>
      </footer>
    </div>
  );
}

export default CartDrawer;
