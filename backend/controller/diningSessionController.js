const DiningSession = require('../models/diningSession');
const Table = require('../models/table');

// Tạo session mới
exports.createDiningSession = async (req, res) => {
  try {
    const {
      tableId,
      userId,
      customerName,
      customerPhone,
      guestCount,
      reservationId,
      specialRequest
    } = req.body;

    // Kiểm tra bàn đã có session active chưa
    const existing = await DiningSession.findOne({ table: tableId, status: 'active' });
    if (existing) return res.status(400).json({ message: 'This table already has an active session.' });

    const sessionData = {
      table: tableId,
      user: userId,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      guestCount: guestCount || 1,
      reservationId: reservationId || null,
      notes: specialRequest || ''
    };

    const session = new DiningSession(sessionData);
    await session.save();

    // Cập nhật trạng thái bàn thành 'occupied'
    await Table.findByIdAndUpdate(tableId, { status: 'occupied' });

    // Populate để trả về thông tin đầy đủ
    const populatedSession = await DiningSession.findById(session._id)
      .populate('table')
      .populate('reservationId');

    res.status(201).json(populatedSession);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy session active theo bàn
exports.getActiveSessionByTable = async (req, res) => {
  try {
    const { tableId } = req.params;
    const session = await DiningSession.findOne({ table: tableId, status: 'active' }).populate('table').populate('reservationId');
    if (!session) return res.status(404).json({ message: 'No active session for this table.' });

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Kết thúc session
// exports.endDiningSession = async (req, res) => {
//   try {
//     const session = await DiningSession.findByIdAndUpdate(
//       req.params.id,
//       { status: 'completed', endTime: new Date() },
//       { new: true }
//     );
//     res.json(session);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// Kết thúc session
exports.endDiningSession = async (req, res) => {
  try {
    const session = await DiningSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session không tồn tại' });

    // Cập nhật session
    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    // Cập nhật trạng thái bàn
    await Table.findByIdAndUpdate(session.table, { status: 'available' });

    res.json({ message: 'Phiên đã được kết thúc thành công', session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await DiningSession.find()
      .populate('table')
      .populate('reservationId')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách sessions' });
  }
};


exports.getSessionById = async (req, res) => {
  try {
    const session = await DiningSession.findById(req.params.id)
      .populate('table')
      .populate('reservationId');
    if (!session) {
      return res.status(404).json({ message: 'Session không tồn tại' });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getUserFromReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId)
      .populate('userId', 'username email phone avatar');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation không tìm thấy' });
    }

    res.json({
      reservation: reservation,
      user: reservation.userId || null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changeTable = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newTableId } = req.body;

    // Kiểm tra session hiện tại
    const currentSession = await DiningSession.findById(sessionId);
    if (!currentSession || currentSession.status !== 'active') {
      return res.status(404).json({ message: 'Session không tồn tại hoặc đã kết thúc' });
    }

    // Kiểm tra bàn mới có trống không
    const existingSession = await DiningSession.findOne({
      table: newTableId,
      status: 'active'
    });
    if (existingSession) {
      return res.status(400).json({ message: 'Bàn mới đã có khách' });
    }

    // Kiểm tra bàn mới có tồn tại không
    const newTable = await Table.findById(newTableId);
    if (!newTable) {
      return res.status(404).json({ message: 'Bàn mới không tồn tại' });
    }

    // Lưu bàn cũ để cập nhật trạng thái
    const oldTableId = currentSession.table;
    const oldTable = await Table.findById(oldTableId);

    // Cập nhật session với bàn mới
    currentSession.table = newTableId;
    currentSession.notes = `${currentSession.notes || ''}\nĐổi từ bàn ${oldTable?.tableNumber || oldTableId} sang bàn ${newTable.tableNumber} lúc ${new Date().toLocaleString('vi-VN')}`.trim();
    await currentSession.save();

    // Cập nhật trạng thái bàn
    await Table.findByIdAndUpdate(oldTableId, { status: 'available' });
    await Table.findByIdAndUpdate(newTableId, { status: 'occupied' });

    // Populate thông tin để trả về
    const updatedSession = await DiningSession.findById(sessionId)
      .populate('table')
      .populate('reservationId');

    res.json({
      message: 'Đổi bàn thành công',
      session: updatedSession
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSessionWithUserInfo = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await DiningSession.findById(sessionId)
      .populate('table')
      .populate({
        path: 'reservationId',
        populate: {
          path: 'userId',
          select: 'username email phone avatar'
        }
      });

    if (!session) {
      return res.status(404).json({ message: 'Session không tồn tại' });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
