const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const createError = require('../util/errorHandle');

// REGISTER
const register = async (req, res, next) => {
  try {
    const { username, email, password, phone } = req.body;

    const existingUser = await User.find({
      $or: [{ username }, { email }],
    });
    if (existingUser.length > 0) {
      return next(createError(400, 'Username or email already exists!'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone: phone || null,
      // role mặc định là 'user' theo schema
    });

    await newUser.save();

    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    res.status(201).json(userToReturn);
  } catch (err) {
    next(err);
  }
};

// LOGIN
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(404, 'User with this email not found!'));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(400, 'Wrong password!'));
    }

    // tạo token với id + role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res
      .cookie('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        ...userWithoutPassword,
        token,
      });
  } catch (err) {
    next(createError(500, 'Login failed!'));
  }
};

module.exports = {
  register,
  login,
};