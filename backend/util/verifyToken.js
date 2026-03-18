const jwt = require('jsonwebtoken');
const createError = require('./errorHandle');


const verifyToken = (req, res, next) => {
  try {
    // Lấy token từ cookie hoặc Authorization header
    let token = req.cookies.access_token;

    // Nếu không tìm thấy token trong cookie, kiểm tra trong Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Kiểm tra xem token có tồn tại không
    if (!token) {
      console.log("No token found in request");
      return next(createError(401, "You are not authenticated!"));
    }

    // Xác thực token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log("Token verification failed:", err.message);
        return next(createError(403, "Token is not valid!"));
      }

      // Lưu thông tin người dùng vào request để sử dụng trong các middleware tiếp theo
      req.hello = user;
      next();
    });
  } catch (error) {
    console.error("Error in verifyToken:", error);
    return next(createError(500, "Authentication process failed"));
  }
}

const verifyUser = (req, res, next) => {
  verifyToken(req, res, (err) => {
    // Nếu verifyToken trả về lỗi, không thực hiện tiếp
    if (err) {
      return next(err);
    }

    // Kiểm tra xem req.hello có tồn tại không
    if (!req.hello) {
      return next(createError(401, "User information not found in token!"));
    }

    // Kiểm tra quyền truy cập
    if (req.hello.id == req.params.id || req.hello.role == 'admin') {
      next();
    } else {
      return next(createError(403, "You are not authorized!"));
    }
  })
}

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    // Nếu verifyToken trả về lỗi, không thực hiện tiếp
    if (err) {
      return next(err);
    }

    // Kiểm tra xem req.hello có tồn tại không
    if (!req.hello) {
      return next(createError(401, "User information not found in token!"));
    }

    // Kiểm tra role admin
    if (req.hello.role === 'admin') {
      next();
    } else {
      return next(createError(403, "You are not authorized!"));
    }
  })
}

module.exports = {
  verifyToken,
  verifyUser,
  verifyAdmin
}