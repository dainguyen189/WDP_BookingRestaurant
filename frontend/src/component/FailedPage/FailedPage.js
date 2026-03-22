import { Link, useSearchParams, useNavigate } from "react-router-dom"
import styles from "./css/failed.module.css"

export default function FailedPage() {
    const [searchParams] = useSearchParams()

    const status = searchParams.get("status")
    const orderCode = searchParams.get("orderCode")
    const cancel = searchParams.get("cancel")

    const handleRetry = () => {
        window.location.reload()


    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.card}>
                    {/* Icon */}
                    <div className={styles.iconWrapper}>
                        <div className={styles.iconBg}></div>
                        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>

                    {/* Heading */}
                    <h1 className={styles.title}>Thanh toán thất bại</h1>
                    <p className={styles.subtitle}>Có lỗi trong quá trình xử lý thanh toán của bạn</p>

                    {/* Error Info */}
                    <div className={styles.infoContainer}>
                        {cancel === "true" && (
                            <div className={styles.alertBox}>
                                <p className={styles.alertText}>Bạn đã hủy thanh toán</p>
                            </div>
                        )}

                        {orderCode && (
                            <div className={styles.infoCard}>
                                <p className={styles.infoLabel}>Mã đơn hàng</p>
                                <p className={styles.infoValue}>{orderCode}</p>
                            </div>
                        )}

                        {status && (
                            <div className={styles.infoCard}>
                                <p className={styles.infoLabel}>Trạng thái lỗi</p>
                                <p className={styles.errorStatus}>{status}</p>
                            </div>
                        )}
                    </div>

                    {/* Helpful Message */}
                    <div className={styles.helpBox}>
                        <p className={styles.helpText}>
                            ✓ Kiểm tra số thẻ của bạn
                            <br />✓ Đảm bảo tài khoản có đủ tiền
                            <br />✓ Liên hệ ngân hàng nếu vấn đề vẫn tiếp tục
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.buttonGroup}>
                        <button className={styles.buttonPrimary} onClick={handleRetry}>
                            ↻ Thử lại
                        </button>
                        <Link to="/cashier">
                            <button className={styles.buttonSecondary}>Quay lại trang chủ</button>
                        </Link>
                    </div>
                </div>

                {/* Support */}
                <div className={styles.support}>
                    <p>
                        Cần giúp đỡ?{" "}
                        <a href="#" className={styles.supportLink}>
                            Liên hệ hỗ trợ
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
