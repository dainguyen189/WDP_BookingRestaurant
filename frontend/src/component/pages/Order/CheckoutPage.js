import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "../../../context/SessionContext";
import Header from "../../Header/Header";
import { useNavigate } from "react-router-dom";
import "./CheckoutPage.css";

function CheckoutPage() {
  const { sessionId, user, setUser } = useSession();
  const [pendingOrder, setPendingOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState({ type: "", text: "" });
  const [isVoucherConfirmed, setIsVoucherConfirmed] = useState(false);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/orders/session/${sessionId}`
        );
        const orderToPay = Array.isArray(res.data)
          ? res.data.find((order) => order.paymentStatus === "unpaid")
          : null;
        setPendingOrder(orderToPay);
        if (orderToPay) {
          setFinalAmount(orderToPay.totalAmount);
        }
      } catch (err) {
        console.error("❌ Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId]);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8080/api/promotions/active"
        );
        if (res.data.success) {
          setVouchers(res.data.data);
        }
      } catch (error) {
        console.error("❌ Error fetching vouchers:", error);
      }
    };
    fetchVouchers();
  }, []);

  const applyVoucherPreview = async (voucherCode) => {
    if (!voucherCode) {
      setDiscount(0);
      setFinalAmount(pendingOrder?.totalAmount || 0);
      setVoucherMessage({ type: "", text: "" });
      return;
    }

    if (!pendingOrder) {
      setVoucherMessage({
        type: "error",
        text: "No order to apply voucher to.",
      });
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:8080/api/orders/${pendingOrder._id}/apply-voucher`,
        { voucherCode }
      );
      if (res.data.success) {
        setDiscount(res.data.data.discount);
        setFinalAmount(res.data.data.newTotalAmount);
        setVoucherMessage({
          type: "info",
          text: 'Nhấn "Áp dụng Voucher" để xác nhận.',
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Đã xảy ra lỗi không xác định.";
      setDiscount(0);
      setFinalAmount(pendingOrder?.totalAmount || 0);
      setVoucherMessage({ type: "error", text: message });
    }
  };

  const handleVoucherChange = (voucherCode) => {
    setSelectedVoucher(voucherCode);
    applyVoucherPreview(voucherCode);
  };

  const handleConfirmVoucher = async () => {
    if (!selectedVoucher || discount <= 0) {
      setVoucherMessage({
        type: "error",
        text: "Vui lòng chọn một voucher hợp lệ.",
      });
      return;
    }
    if (!user) {
      setVoucherMessage({
        type: "error",
        text: "Không tìm thấy thông tin người dùng.",
      });
      return;
    }

    setIsApplyingVoucher(true);
    setVoucherMessage({ type: "info", text: "Đang áp dụng voucher..." });

    try {
      const response = await axios.post(
        "http://localhost:8080/api/promotions/convertPointToPromotion",
        {
          userId: user._id,
          voucherCode: selectedVoucher,
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
        setIsVoucherConfirmed(true);
        setVoucherMessage({
          type: "success",
          text: "Áp dụng voucher thành công!",
        });
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Không thể áp dụng voucher. Vui lòng thử lại.";
      setVoucherMessage({ type: "error", text: message });
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleNavigateToPayment = () => {
    if (pendingOrder) {
      navigate("/payment-gateway", {
        state: {
          orderId: pendingOrder._id,
          amount: finalAmount,
        },
      });
    } else {
      alert("No unpaid order found to proceed with payment.");
    }
  };

  if (loading)
    return <div className="loading-container">🔄 Loading your order...</div>;
  if (!sessionId)
    return <div className="info-container">⚠️ No dining session found!</div>;
  if (!pendingOrder) {
    return (
      <>
        <Header />
        <div className="info-container">
          <h3>🧺 You have no orders to pay.</h3>
          <button
            onClick={() => navigate(`/menu?sessionId=${sessionId}`)}
            className="btn-action"
          >
            🍽 Order Now
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="checkout-container">
        <h2> Hóa đơn của bạn</h2>
        <div key={pendingOrder._id} className="order-card">
          <h4>
            {new Date(pendingOrder.orderTime).toLocaleString("en-US")}
          </h4>
          {/* <p>
            <strong>Payment Status:</strong>{" "}
            <span className={`status-${pendingOrder.paymentStatus}`}>
              {pendingOrder.paymentStatus === "unpaid" ? "Unpaid" : "Paid"}
            </span>
          </p> */}

          <ul className="order-items-list">
            {pendingOrder.items.map((item) => (
              <li key={item._id}>
                 {item.menuItemId?.name || "Unknown Item"} × {item.quantity} —{" "}
                {item.price.toLocaleString("en-US")}₫
              </li>
            ))}
          </ul>

          {/* <p className="sub-total">
            <strong>Tổng phụ: </strong>
            {pendingOrder.totalAmount?.toLocaleString("en-US") || 0}₫
          </p> */}
          {discount > 0 && (
            <p className="discount-applied">
              <strong>
Giảm giá: </strong>-{discount.toLocaleString("en-US")}₫
            </p>
          )}
          <p className="total-amount">
            <strong>Tổng cộng: </strong>
            {finalAmount?.toLocaleString("en-US") || 0}₫
          </p>
        </div>

        <div className="user-points-container">
          <p>
             <strong>Điểm hiện tại của bạn:</strong> {user?.points || 0}
          </p>
        </div>

        {!isVoucherConfirmed ? (
          <div className="voucher-section">
            <select
              className="voucher-select"
              value={selectedVoucher}
              onChange={(e) => handleVoucherChange(e.target.value)}
            >
              <option value="">-- 
Chọn Voucher --</option>
              {vouchers.map((voucher) => (
                <option key={voucher._id} value={voucher.code}>
                  {voucher.code} - {voucher.description} ({voucher.points_required}{" "}
                  Points)
                </option>
              ))}
            </select>
            <button
              onClick={handleConfirmVoucher}
              className="btn-apply-voucher"
              disabled={!selectedVoucher || discount <= 0 || isApplyingVoucher}
            >
              {isApplyingVoucher ? "Applying..." : "Áp dụng Voucher"}
            </button>
          </div>
        ) : null}

        {voucherMessage.text && (
          <p className={`voucher-message ${voucherMessage.type}`}>
            {voucherMessage.text}
          </p>
        )}

        <div className="action-buttons">
          <button
            onClick={() => navigate(`/menu?sessionId=${sessionId}`)}
            className="btn-action"
          >
            Gọi thêm món
          </button>
      
        </div>
      </div>
    </>
  );
}

export default CheckoutPage;
