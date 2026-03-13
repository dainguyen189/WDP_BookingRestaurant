import React from "react";
import { useOrder } from "../../../context/OrderContext";
import { useSession } from "../../../context/SessionContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ConfirmOrderPage() {
  const { cartItems, clearCart } = useOrder();
  const { sessionId } = useSession();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    if (!sessionId) {
      alert("Chưa có session!");
      return;
    }

    const orderData = {
      sessionId,
      items: cartItems.map(item => ({
        menuItemId: item._id,
        quantity: item.quantity,
        notes: item.notes || "",
        price: item.price
      }))
    };

    try {
      await axios.post("http://localhost:8080/api/orders", orderData);
      alert("Đơn hàng đã được gửi thành công!");
      clearCart();
      navigate("/checkout");
    } catch (error) {
      alert("Gửi đơn hàng thất bại!");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Xác nhận đơn hàng</h2>
      <ul>
        {cartItems.map(item => (
          <li key={item._id}>
            {item.name} x {item.quantity} ({item.notes})
          </li>
        ))}
      </ul>
      <button onClick={handleConfirm}>✅ Gửi đơn</button>
      <button onClick={() => navigate(-1)}>❌ Quay lại</button>
    </div>
  );
}

export default ConfirmOrderPage;
