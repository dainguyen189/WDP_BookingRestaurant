const User = require("../models/user");
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const DiningSession = require("../models/diningSession");
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password -__v");
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");
    if (!user) {
      return next(createError(404, "User not found!"));
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

const createUser = async (req, res, next) => {
  try {
    const { username, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: 'user',
      phone
    });

    await newUser.save();

    // Return user without password
    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    res.status(201).json(userToReturn);
  } catch (err) {
    next(err);

  }
}

const updateUser = async (req, res, next) => {
  try {
    const { username, email, role, phone, password } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const updateData = {
      username: username || user.username,
      email: email || user.email,
      role: role || user.role,
      phone: phone || user.phone
    };

    // Only update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password -__v");

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const getUserBySessionId = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const diningSession = await DiningSession.findById(sessionId);

    if (!diningSession) {
      return res.status(404).json({ success: false, message: "Dining session not found." });
    }

    const userId = diningSession.user;
    if (!userId) {
      return res.status(200).json({ success: true, data: null, message: "This is a guest session." });
    }

    const user = await User.findById(userId).select("username points");

    if (!user) {
      return res.status(404).json({ success: false, message: "User associated with this session not found." });
    }

    res.status(200).json({ success: true, data: user });

  } catch (err) {
    next(err);
  }
};


const searchUser = async (req, res, next) => {

  const query = req.query.q;

  if (!query) {
    return next(createError(400, "Search query is required."));
  }

  try {
    const lowercasedQuery = query.toLowerCase();

    const mongoQuery = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: lowercasedQuery }
      ]
    };

    const user = await User.findOne(mongoQuery).select('-password');


    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, user });

  } catch (error) {
    next(createError(500, "Error while searching for user."));
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword
    });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  getUserBySessionId,
  deleteUser,
  searchUser,
  changePassword
}
