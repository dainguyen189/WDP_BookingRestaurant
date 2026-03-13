import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/axiosConfig';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './ZaloPayGateway.css'; 

function ZaloPayGateway() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, amount } = location.state || { orderId: null, amount: 0 };

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [appTransId, setAppTransId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    console.log("🔍 Dữ liệu nhận được từ trang hóa đơn (location.state):", location.state);

    if (!orderId) {
      setError('Lỗi: Không có thông tin đơn hàng được truyền đến trang này. Vui lòng thử lại từ trang hóa đơn.');
      setIsLoading(false);
      return;
    }

    const createOrder = async () => {
      try {
        console.log(`🔄 Đang tạo đơn hàng ZaloPay cho orderId: ${orderId}`);
        const res = await axiosInstance.post('/zalopay/create-order', { orderId });
        console.log("📥 Phản hồi từ API:", res.data);
        setDebugInfo(res.data);

        if (res.data.success && res.data.zaloPayResponse) {
          const zaloPayResponse = res.data.zaloPayResponse;
          
          // Check if we have order_url for QR code
          if (zaloPayResponse.order_url) {
            console.log("✅ Có order_url, tạo QR code:", zaloPayResponse.order_url);
            setQrCodeUrl(zaloPayResponse.order_url);
            setAppTransId(res.data.app_trans_id);
            setError('');
          } else {
            console.error("❌ Không có order_url trong phản hồi ZaloPay:", zaloPayResponse);
            const errorMessage = zaloPayResponse.return_message || 'Không thể tạo mã QR từ ZaloPay';
            setError(`Lỗi ZaloPay: ${errorMessage}`);
          }
        } else {
          console.error("❌ API response không thành công:", res.data);
          const errorMessage = res.data.message || 'Phản hồi từ server không hợp lệ';
          setError(`Lỗi: ${errorMessage}`);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tạo đơn hàng ZaloPay:", err);
        if (err.response) {
          console.error("📋 Chi tiết lỗi từ server:", err.response.data);
          setError(`Lỗi từ server: ${err.response.data.message || err.message} (Mã: ${err.response.status})`);
          setDebugInfo(err.response.data);
        } else if (err.request) {
          console.error("🌐 Lỗi kết nối:", err.request);
          setError('Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối và trạng thái backend.');
        } else {
          console.error("❓ Lỗi không xác định:", err);
          setError('Lỗi không xác định khi thiết lập yêu cầu.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    createOrder();
  }, [orderId, location.state]);

  useEffect(() => {
    if (!appTransId) return;

    const intervalId = setInterval(async () => {
      try {
        console.log(`Kiểm tra trạng thái cho app_trans_id: ${appTransId}`);
        const res = await axiosInstance.post('/zalopay/status', { app_trans_id: appTransId });
        
        if (res.data.ourDbStatus === 'paid') {
          clearInterval(intervalId);
          alert('Thanh toán thành công!');
          navigate(`/payment-result?status=success&orderId=${orderId}&amount=${amount}&apptransid=${appTransId}`);
        }
      } catch (err) {
        console.error("Lỗi khi polling:", err);
      }
    }, 5000); 

    return () => clearInterval(intervalId);
  }, [appTransId, navigate, orderId, amount]);

  return (
    <div className="gateway-container">
      <div className="gateway-card">
        <h2>Thanh toán qua ZaloPay</h2>
        <p className="gateway-amount">
          Số tiền: <span>{amount?.toLocaleString('vi-VN')}₫</span>
        </p>
        
        {isLoading && <div className="loader">Đang tạo mã...</div>}
        
        {error && (
            <div className="error-message">
                <p><strong>Rất tiếc, đã có lỗi xảy ra!</strong></p>
                <p>{error}</p>
                {debugInfo && (
                    <details style={{ marginTop: '10px', fontSize: '12px' }}>
                        <summary>Chi tiết lỗi (Debug)</summary>
                        <pre style={{ 
                            background: '#f5f5f5', 
                            padding: '10px', 
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '200px'
                        }}>
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        )}
        
        {qrCodeUrl && (
          <div className="qr-section">
            <p>Sử dụng ứng dụng ZaloPay hoặc App ngân hàng để quét mã QR</p>
            <div className="qr-code-wrapper">
              <QRCodeSVG 
                value={qrCodeUrl} 
                size={256} 
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="waiting-text">Đang chờ thanh toán...</p>
            <p className="qr-url-text" style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
              URL: {qrCodeUrl}
            </p>
          </div>
        )}

        {!isLoading && !qrCodeUrl && !error && (
          <div className="no-qr-message">
            <p>Không thể tạo mã QR. Vui lòng thử lại.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default ZaloPayGateway;
