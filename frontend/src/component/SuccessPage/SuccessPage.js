import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import styles from "./success.module.css"

export default function SuccessPage() {
    const [searchParams] = useSearchParams()
    const status = searchParams.get("status")
    const orderCode = searchParams.get("orderCode")
    const transactionId = searchParams.get("id")
    const [copied, setCopied] = useState(null)

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text)
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.card}>
                    {/* Icon */}
                    <div className={styles.iconWrapper}>
                        <div className={styles.iconBg}></div>
                        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                {copied === "orderCode" && <p className={styles.copiedText}>Đã sao chép</p>}
                            </div>
                        )}

                        {transactionId && (
                            <div className={styles.infoCard}>
                                <p className={styles.infoLabel}>Mã giao dịch</p>
                                <div className={styles.infoContent}>
                                    <p className={styles.infoValue}>{transactionId}</p>
                                    <button
                                        onClick={() => copyToClipboard(transactionId, "transactionId")}
                                        className={styles.copyBtn}
                                        title="Copy"
                                    >
                                        📋
                                    </button>
                                </div>
                                {copied === "transactionId" && <p className={styles.copiedText}>Đã sao chép</p>}
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
                            <button className={styles.buttonPrimary}>Quay lại trang chủ</button>
                        </Link>
                        <button className={styles.buttonSecondary}>Tải hoá đơn</button>
                    </div>
                </div>

                {/* Support */}
                <div className={styles.support}>
                    <p>Nếu bạn có thắc mắc, vui lòng liên hệ hỗ trợ khách hàng</p>
                </div>
            </div>
        </div>
    )
}
