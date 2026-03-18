const emailUtil = require('../util/send-mail.util');
const { bookingConfirmationEmail } = require('../assets/email-templates/booking-confirmation');

exports.sendBookingConfirm = async ({ email, name, otp }) => {
  // Let errors bubble up so callers can handle failures properly
  await emailUtil.sendEmail({
    to: email,
    subject: "Xác nhận đặt bàn",
    html: bookingConfirmationEmail({ otp, customerName: name }),
  });
};
