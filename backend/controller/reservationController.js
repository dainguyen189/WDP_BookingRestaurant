// controllers/reservation.controller.js
const { validationResult } = require("express-validator");
const Reservation = require("../models/reservation");
const emailService = require('../services/email.service');
const sms = require("../services/sms.service");
const cache = require('../util/cache');
const crypto = require('crypto');
const mongoose = require('mongoose');

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_LENGTH = 6;

function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

exports.bookingOtpEmail = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate email exists
    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc." });
    }

    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    // Basic env checks for email transport
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('EMAIL_USER/EMAIL_PASS is not configured');
      return res.status(500).json({ message: 'Email server chưa được cấu hình (EMAIL_USER/EMAIL_PASS).' });
    }

    const otp = generateOTP(OTP_LENGTH);
    const cleanEmail = email.trim().toLowerCase();
    const key = `email_${cleanEmail}`;
    
    // Store OTP in cache with email prefix to avoid conflicts
    cache.set(key, otp, OTP_TTL_SECONDS);

    const checkCache = cache.get(key);
    if (!checkCache) {
      throw new Error("Cache failed to store OTP.");
    }

    // Only log OTP in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for email ${cleanEmail}: ${otp}`);
    } else {
      console.log(`OTP sent to email ${cleanEmail}`);
    }
    
    // Send email with OTP (name is optional, will default to 'Quý khách' in template)
    await emailService.sendBookingConfirm({ 
      otp, 
      email: cleanEmail, 
      name: name || 'Quý khách' 
    });

    return res.status(201).json({ 
      success: true, 
      message: "OTP đã được gửi đến email của bạn." 
    });
  } catch (error) {
    console.error('Error sending email OTP:', error);
    
    // Provide user-friendly error messages
    let errorMessage = "Lỗi máy chủ khi gửi OTP qua email.";
    
    if (error.code === 'EAUTH' || error.message?.includes('EAUTH') || error.message?.includes('xác thực')) {
      errorMessage = "Lỗi xác thực Gmail. Vui lòng kiểm tra cấu hình EMAIL_USER và EMAIL_PASS trong file .env. " +
        "Bạn cần sử dụng App Password (không phải mật khẩu thông thường). " +
        "Xem hướng dẫn: https://myaccount.google.com/apppasswords";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.bookingOtpPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    // Enhanced validation
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ message: 'Số điện thoại là bắt buộc.' });
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Validate phone number format
    if (!/^[0-9]{9,15}$/.test(cleanPhone)) {
      return res.status(400).json({ 
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại từ 9-15 chữ số.' 
      });
    }

    // Generate OTP
    const otp = generateOTP(OTP_LENGTH);
    const key = `phone_${cleanPhone}`;

    // Save to cache with phone prefix to avoid conflicts
    cache.set(key, otp, OTP_TTL_SECONDS);

    const checkCache = cache.get(key);
    if (!checkCache) {
      throw new Error('Lưu OTP vào bộ nhớ đệm thất bại.');
    }

    // Only log OTP in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for phone ${cleanPhone}: ${otp}`);
    } else {
      console.log(`OTP sent to phone ${cleanPhone}`);
    }

    const requestId = crypto.randomBytes(4).toString('hex');

    // Basic env checks for SMS
    if (!process.env.ESMS_API_KEY || !process.env.ESMS_SECRET_KEY) {
      console.error('ESMS_API_KEY/ESMS_SECRET_KEY is not configured');
      return res.status(500).json({ message: 'SMS server chưa được cấu hình (ESMS_API_KEY/ESMS_SECRET_KEY).' });
    }

    await sms.sendEsms({
     phone: cleanPhone,
     code: otp,
     requestId
    });

    return res.status(201).json({ 
      success: true, 
      message: 'OTP đã được gửi đến số điện thoại của bạn.' 
    });

  } catch (error) {
    console.error('Error sending SMS OTP:', error.message);
    
    // Provide more detailed error messages
    let errorMessage = 'Lỗi máy chủ khi gửi OTP qua SMS.';
    
    if (error.message?.includes('Brand name')) {
      errorMessage = 'Lỗi cấu hình Brandname. Vui lòng kiểm tra ESMS_SMS_TYPE trong file .env.';
    } else if (error.message?.includes('Incorrect username')) {
      errorMessage = 'Lỗi xác thực eSMS. Vui lòng kiểm tra ESMS_API_KEY và ESMS_SECRET_KEY.';
    } else if (error.message?.includes('balance')) {
      errorMessage = 'Tài khoản eSMS hết tiền. Vui lòng liên hệ quản trị viên.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed.",
        errors: errors.array(),
      });
    }

    const {
      otp, otpTarget, email, phone, specialRequest,
      name, reservationDate, reservationTime,
      guestCount, preOrders, accountId
    } = req.body;

    // Validate OTP input
    if (!otp || !otpTarget) {
      return res.status(400).json({ message: "OTP và phương thức xác thực là bắt buộc." });
    }

    // Validate OTP format (should be 6 digits)
    if (!/^\d{6}$/.test(otp.toString())) {
      return res.status(400).json({ message: "Mã OTP phải có 6 chữ số." });
    }

    // Determine the correct cache key based on OTP target
    let key;
    
    if (otpTarget === 'email') {
      if (!email) {
        return res.status(400).json({ message: "Email là bắt buộc khi xác thực qua email." });
      }
      const cleanEmail = email.trim().toLowerCase();
      key = `email_${cleanEmail}`;
    } else if (otpTarget === 'phone') {
      if (!phone) {
        return res.status(400).json({ message: "Số điện thoại là bắt buộc khi xác thực qua SMS." });
      }
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      key = `phone_${cleanPhone}`;
    } else {
      return res.status(400).json({ message: "Phương thức xác thực không hợp lệ." });
    }

    const storedOtp = cache.get(key);
    console.log('OTP check:', key, storedOtp, 'Input OTP:', otp);

    if (!storedOtp) {
      return res.status(400).json({ 
        message: "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới." 
      });
    }

    if (storedOtp.toString() !== otp.toString()) {
      return res.status(400).json({ 
        message: "Mã OTP không chính xác. Vui lòng kiểm tra lại." 
      });
    }

    // OTP is valid, remove it from cache
    cache.del(key);

    // Create reservation with all fields
    const reservationData = {
      name,
      phone: phone || null,
      email: email || null,
      reservationDate,
      reservationTime,
      guestCount,
      specialRequest,
      preOrders: preOrders || [],
      status: 'pending'
    };

    // Add userId or accountId if provided and valid
    if (accountId && mongoose.Types.ObjectId.isValid(accountId.trim())) {
      reservationData.userId = accountId;
      reservationData.accountId = accountId;
    }

    const newReservation = new Reservation(reservationData);
    await newReservation.save();

    return res.status(201).json(newReservation);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get all reservations
exports.getReservations = async (req, res) => {
  try {
    const {
      phone,
      name,
      reservationDate,
      startTime,
      endTime,
      guestCount,
      status,
      specialRequest,
      userId,
      accountId,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {};

    if (phone) {
      filters.phone = { $regex: phone, $options: 'i' };
    }
    if (name) {
      filters.name = { $regex: name, $options: 'i' };
    }
    if (specialRequest) {
      filters.specialRequest = { $regex: specialRequest, $options: 'i' };
    }
    if (status) {
      filters.status = status;
    }
    if (reservationDate) filters.reservationDate = reservationDate;
    if (guestCount) filters.guestCount = parseInt(guestCount);

    // Filter by userId or accountId
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filters.$or = [
        { userId: new mongoose.Types.ObjectId(userId) },
        { accountId: new mongoose.Types.ObjectId(userId) },
        { customerId: new mongoose.Types.ObjectId(userId) }
      ];
    } else if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
      filters.$or = [
        { userId: new mongoose.Types.ObjectId(accountId) },
        { accountId: new mongoose.Types.ObjectId(accountId) },
        { customerId: new mongoose.Types.ObjectId(accountId) }
      ];
    }

    if (startTime || endTime) {
      filters.reservationTime = {};
      if (startTime) filters.reservationTime.$gte = startTime;
      if (endTime) filters.reservationTime.$lte = endTime;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reservations, total] = await Promise.all([
      Reservation.find(filters).skip(skip).limit(parseInt(limit))
      .sort({reservationDate: -1, createdAt: -1})
      .populate('preOrders.itemId'),
      Reservation.countDocuments(filters)
    ]);

    res.status(200).json({
      total,
      page: parseInt(page),
      pageSize: reservations.length,
      totalPages: Math.ceil(total / limit),
      reservations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single reservation by ID
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('customerId');
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.status(200).json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a reservation
exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.status(200).json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a reservation
exports.deleteReservation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Bad request",
        errors: errors.array()
      });
    }
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.status(200).json({ message: 'Reservation deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
