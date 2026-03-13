import React, { useState } from "react";
import { useOrder } from "../../../context/OrderContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSession } from "../../../context/SessionContext";
import "./CartDrawer.css";

function CartItem({ item, increaseQuantity, decreaseQuantity, updateNote, removeFromCart }) {
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <li className={`cart-item ${noteOpen ? "active" : ""}`}>
      <div className="item-info">
        <span title={item.name}>{item.name}</span>
        <div className="quantity-control">
          <button onClick={() => decreaseQuantity(item._id)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => increaseQuantity(item._id)}>+</button>
        </div>
        <div>{(item.price * item.quantity).toLocaleString()}₫</div>
      </div>

      <button
        onClick={() => setNoteOpen(!noteOpen)}
        style={{
          marginTop: "6px",
          backgroundColor: "#444",
          color: "#ffcc00",
          border: "none",
          padding: "4px 8px",
          cursor: "pointer",
          borderRadius: "4px",
          fontSize: "0.85rem",
          alignSelf: "flex-start",
        }}
      >
        {noteOpen ? "Hide Note" : "Add Note"}
      </button>

      {noteOpen && (
        <input
          type="text"
          placeholder="Add note"
          value={item.notes || ""}
          onChange={(e) => updateNote(item._id, e.target.value)}
        />
      )}

      <button className="remove-btn" onClick={() => removeFromCart(item._id)}>
         Remove
      </button>
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
    <div className={`cart-drawer ${isOpen ? "open" : ""}`}>
      <div className="cart-header">
        <h3> Your Cart</h3>
        <button className="btn btn-danger" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="cart-body">
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
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

      <div className="cart-footer">
        <p className="total">Total: {total.toLocaleString()}₫</p>
        <button className="send-btn" onClick={handleSendOrder}>
           Send Order
        </button>
        <button className="clear-btn" onClick={clearCart}>
           Clear All
        </button>
      </div>
    </div>
  );
}

export default CartDrawer;
