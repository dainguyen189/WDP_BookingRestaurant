const axios = require('axios');

exports.sendEsms = async ({ phone, code, requestId }) => {
  const apiKey = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;
  const url = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/';

  // Sử dụng Brandname từ .env hoặc mặc định (phải được đăng ký trước trong tài khoản eSMS)
  // Nếu không có Brandname được phê duyệt, dùng SmsType: 8 (SMS không Brandname)
  const brandname = process.env.ESMS_BRANDNAME || 'Baotrixemay';
  const smsType = process.env.ESMS_SMS_TYPE || '8'; // 8 = SMS không brandname, 2 = SMS có brandname

  const data = {
    ApiKey: apiKey,
    SecretKey: secretKey,
    Phone: phone,
    Content: `Ma OTP xac nhan dat ban cua ban la: ${code}. Ma co hieu luc trong 5 phut.`,
    Brandname: smsType === '8' ? '' : brandname, // Không cần Brandname nếu dùng SmsType 8
    SmsType: smsType,
    IsUnicode: '0',
    campaignid: 'dat ban',
    RequestId: requestId,
    CallbackUrl: 'https://esms.vn/webhook/'
  };

  // Log để debug
  console.log('SMS Config:', {
    Phone: phone,
    Brandname: data.Brandname || '(không dùng)',
    SmsType: smsType,
    Content: data.Content.substring(0, 50) + '...'
  });

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('SMS Sent:', response.data);
    
    // Kiểm tra kết quả
    if (response.data.CodeResult === '100') {
      console.log('✅ SMS đã được gửi thành công');
    } else {
      console.error('❌ SMS gửi thất bại:', response.data.ErrorMessage);
      throw new Error(`SMS failed: ${response.data.ErrorMessage}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error.response?.data || error.message);
    
    // Cung cấp thông báo lỗi rõ ràng hơn
    if (error.response?.data?.ErrorMessage) {
      throw new Error(`eSMS Error: ${error.response.data.ErrorMessage}`);
    }
    
    throw error;
  }
}
