import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './PaymentResult.css'; 

function PaymentResult() {
  const [searchParams] = useSearchParams();
  
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const bankCode = searchParams.get('bankcode'); 
  const resultCode = searchParams.get('resultCode'); 
  
  const isSuccess = status === 'success';

  return (
    <div className={`result-container ${isSuccess ? 'success' : 'failed'}`}>
      <div className="result-card">
        <div className="result-icon">
            {isSuccess ? '✅' : '❌'}
        </div>
        <h1>{isSuccess ? 'Giao dịch Thành công' : 'Giao dịch Thất bại'}</h1>
        <p className="result-message">
          {isSuccess 
            ? 'Cảm ơn bạn đã thanh toán. Chúc bạn có một bữa ăn ngon miệng!' 
            : 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ nhân viên.'
          }
        </p>
        
        <div className="result-details">
            <p><strong>Mã đơn hàng:</strong> {orderId || 'Không có'}</p>
            {isSuccess && amount && (
                <p><strong>Số tiền:</strong> {(parseInt(amount)).toLocaleString('vi-VN')} VNĐ</p>
            )}
            {isSuccess && bankCode && (
                 <p><strong>Ngân hàng:</strong> {bankCode}</p>
            )}
            {!isSuccess && resultCode && (
                 <p><strong>Mã lỗi:</strong> {resultCode}</p>
            )}
        </div>
        
        <div className="result-actions">
            {isSuccess && orderId && (
                <Link to={`/invoice/print/${orderId}`} className="btn-action btn-print">
                    In Hóa đơn
                </Link>
            )}
            <Link to="/" className="btn-action btn-home">Quay về Trang chủ</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
