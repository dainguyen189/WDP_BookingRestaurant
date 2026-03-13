const User = require('../models/user');
const bcrypt = require('bcrypt');
const createError = require('../util/errorHandle');

// GET /api/user  - View users (admin)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password -__v');
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

// GET /api/user/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    if (!user) return next(createError(404, 'User not found!'));
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

// POST /api/user/createUser  - Create user account
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      role: role || 'user',
    });

    await newUser.save();

    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    res.status(201).json(userToReturn);
  } catch (err) {
    next(err);
  }
};

// PUT /api/user/updateUser/:id  - Edit employee's profile
const updateUser = async (req, res, next) => {
  try {
    const { username, email, role, phone, password, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found!'));

    const updateData = {
      username: username ?? user.username,
      email: email ?? user.email,
      role: role ?? user.role,
      phone: phone ?? user.phone,
    };

    // Nếu schema có trường status (Active/Inactive) có thể set ở đây
    if (typeof status !== 'undefined') {
      updateData.status = status;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password -__v');

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/user/deleteUser/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found!'));

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/user/search?q=...
const searchUser = async (req, res, next) => {
  const query = req.query.q;
  if (!query) return next(createError(400, 'Search query is required.'));

  try {
    const lowercasedQuery = query.toLowerCase();
    const mongoQuery = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: lowercasedQuery },
      ],
    };

    const user = await User.findOne(mongoQuery).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(createError(500, 'Error while searching for user.'));
  }
};

// PUT /api/user/change-password/:id
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found'));

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashedNew });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUser,
  changePassword,
};

