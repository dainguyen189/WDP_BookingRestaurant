const nodemailer = require('nodemailer');

// Detect email provider and return appropriate SMTP config
function getEmailConfig() {
  const email = process.env.EMAIL_USER || '';
  const emailLower = email.toLowerCase();
  
  // Gmail configuration (also used by some FPT emails)
  if (emailLower.includes('@gmail.com') || emailLower.includes('@fpt.edu.vn')) {
    return {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }
  
  // Outlook/Hotmail configuration
  if (emailLower.includes('@outlook.com') || emailLower.includes('@hotmail.com') || emailLower.includes('@live.com')) {
    return {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3'
      }
    };
  }
  
  // Custom SMTP configuration if provided
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }
  
  // Default: Use Gmail SMTP (works for many email providers)
  return {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };
}

exports.sendEmail = async ({ to, subject, html }) => {
  // Validate email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER và EMAIL_PASS chưa được cấu hình trong file .env');
  }

  const emailConfig = getEmailConfig();
  
  const transporter = nodemailer.createTransport({
    ...emailConfig,
    // Add timeout and connection options
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  // Verify connection configuration
  try {
    await transporter.verify();
    console.log('Email server connection verified');
  } catch (error) {
    console.error('Email server verification failed:', error.message);
    if (error.code === 'EAUTH') {
      const email = process.env.EMAIL_USER || '';
      const isGmail = email.toLowerCase().includes('@gmail.com');
      
      if (isGmail) {
        throw new Error('Lỗi xác thực Gmail. Vui lòng kiểm tra:\n' +
          '1. Đã bật 2-Step Verification trên tài khoản Gmail\n' +
          '2. Đã tạo App Password (không phải mật khẩu thông thường)\n' +
          '3. Sử dụng App Password trong biến môi trường EMAIL_PASS\n' +
          'Hướng dẫn: https://support.google.com/accounts/answer/185833');
      } else {
        throw new Error('Lỗi xác thực email. Vui lòng kiểm tra:\n' +
          '1. EMAIL_USER và EMAIL_PASS trong file .env\n' +
          '2. Đảm bảo mật khẩu đúng (có thể cần App Password)\n' +
          '3. Nếu dùng email FPT/Office365, có thể cần cấu hình SMTP_HOST và SMTP_PORT\n' +
          'Ví dụ: SMTP_HOST=smtp.office365.com, SMTP_PORT=587, SMTP_SECURE=false');
      }
    }
    throw error;
  }

  const mailOptions = {
    from: `"No Joke Restaurant" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      const email = process.env.EMAIL_USER || '';
      const isGmail = email.toLowerCase().includes('@gmail.com');
      
      if (isGmail) {
        throw new Error('Lỗi xác thực Gmail. Vui lòng:\n' +
          '1. Kiểm tra EMAIL_USER và EMAIL_PASS trong file .env\n' +
          '2. Đảm bảo đã bật 2-Step Verification\n' +
          '3. Sử dụng App Password (không phải mật khẩu thông thường)\n' +
          'Tạo App Password: https://myaccount.google.com/apppasswords');
      } else {
        throw new Error('Lỗi xác thực email. Vui lòng:\n' +
          '1. Kiểm tra EMAIL_USER và EMAIL_PASS trong file .env\n' +
          '2. Đảm bảo mật khẩu đúng (có thể cần App Password)\n' +
          '3. Nếu dùng email FPT/Office365, thử thêm vào .env:\n' +
          '   SMTP_HOST=smtp.office365.com\n' +
          '   SMTP_PORT=587\n' +
          '   SMTP_SECURE=false');
      }
    }
    
    throw error;
  }
};
