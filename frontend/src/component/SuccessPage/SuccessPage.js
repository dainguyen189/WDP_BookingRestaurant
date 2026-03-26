import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import styles from "./css/success.module.css";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const orderCode = searchParams.get("orderCode");
  const sessionId = searchParams.get("sessionId");
  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("id");
  const [copied, setCopied] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchOrderToPay = async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:8080/api/orders/session/${sessionId}`,
      );
      const ordersData = Array.isArray(res.data) ? res.data : [];
      const orderToPay = ordersData.find(
        (order) => order.paymentStatus === "unpaid",
      );
      setPendingOrder(orderToPay);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setPendingOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderToPay();
  }, [sessionId]);

  useEffect(() => {
    if (!pendingOrder || !orderId) return;

    const markPaid = async () => {
      if (!orderId) return;

      try {
        await axios.put(
          `http://localhost:8080/api/orders/${pendingOrder._id}/pay-by-payos`,
        );

        await addPointsForOrder(pendingOrder);

        if (sessionId) {
          await axios.put(
            `http://localhost:8080/api/dining-sessions/${sessionId}/complete`,
          );
        }

        console.log("Marked as paid");
      } catch (err) {
        console.error("Error marking paid:", err);
      }
    };

    const addPointsForOrder = async (order) => {
      if (!order.userId) {
        console.log("Đơn hàng không có thông tin user, bỏ qua việc cộng điểm.");
        return;
      }
      try {
        await axios.post(
          "http://localhost:8080/api/promotions/addpointsAfterPayment",
          {
            userId:
              typeof order.userId === "object"
                ? order.userId._id
                : order.userId,
            totalAmount: order.totalAmount,
          },
        );
        console.log("Cộng điểm thành công.");
      } catch (pointError) {
        console.warn(
          "⚠️ Đã có lỗi xảy ra khi cộng điểm:",
          pointError.response?.data || pointError.message,
        );
      }
    };

    markPaid();
  }, [pendingOrder, orderId, sessionId]);

  if (loading) return <div className="info-container">🔄 Đang tải...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          {/* Icon */}
          <div className={styles.iconWrapper}>
            <div className={styles.iconBg}></div>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          {/* Heading */}
          <h1 className={styles.title}>Thanh toán thành công</h1>
          <p className={styles.subtitle}>Cảm ơn bạn đã hoàn tất giao dịch</p>

          {/* Info Cards */}
          <div className={styles.infoContainer}>
            {orderCode && (
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Mã đơn hàng</p>
                <div className={styles.infoContent}>
                  <p className={styles.infoValue}>{orderCode}</p>
                  <button
                    onClick={() => copyToClipboard(orderCode, "orderCode")}
                    className={styles.copyBtn}
                    title="Copy"
                  >
                    📋
                  </button>
                </div>
                {copied === "orderCode" && (
                  <p className={styles.copiedText}>Đã sao chép</p>
                )}
              </div>
            )}

            {transactionId && (
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Mã giao dịch</p>
                <div className={styles.infoContent}>
                  <p className={styles.infoValue}>{transactionId}</p>
                  <button
                    onClick={() =>
                      copyToClipboard(transactionId, "transactionId")
                    }
                    className={styles.copyBtn}
                    title="Copy"
                  >
                    📋
                  </button>
                </div>
                {copied === "transactionId" && (
                  <p className={styles.copiedText}>Đã sao chép</p>
                )}
              </div>
            )}

            {status && (
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Trạng thái</p>
                <p className={styles.statusBadge}>{status}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <Link to="/">
              <button className={styles.buttonPrimary}>
                Quay lại trang chủ
              </button>
            </Link>
            <button
              className={styles.buttonSecondary}
              disabled={!pendingOrder}
              onClick={() => navigate(`/invoice/print/${pendingOrder?._id}`)}
            >
              Xem hoá đơn
            </button>
          </div>
        </div>

        {/* Support */}
        <div className={styles.support}>
          <p>Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ khách hàng</p>
        </div>
      </div>
    </div>
  );
}
