exports.bookingConfirmationEmail = ({otp, customerName = 'Quý khách'}) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Xác nhận OTP đặt bàn</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#d62828; padding:20px; text-align:center;">
              <h1 style="color:#ffffff; margin:0;">Xác nhận đặt bàn</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <p style="font-size:16px; color:#333;">Xin chào <strong>${customerName}</strong>,</p>
              <p style="font-size:16px; color:#333;">
                Cảm ơn bạn đã đặt bàn tại <strong>No Joke Restaurant</strong>. Vui lòng sử dụng mã OTP dưới đây để xác nhận đặt bàn:
              </p>
              <div style="text-align:center; margin:30px 0;">
                <span style="display:inline-block; font-size:28px; font-weight:bold; background-color:#f1f1f1; padding:12px 24px; border-radius:6px; letter-spacing:6px; color:#d62828;">
                  ${otp}
                </span>
              </div>
              <p style="font-size:15px; color:#555;">
                Mã OTP này sẽ hết hạn sau <strong>5 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
              </p>
              <p style="font-size:15px; color:#555;">Trân trọng,<br><strong>No Joke Restaurant</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f1f1f1; text-align:center; padding:15px;">
              <p style="font-size:12px; color:#999; margin:0;">© 2025 No Joke Restaurant</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>

`;
