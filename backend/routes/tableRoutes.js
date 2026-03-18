// routes/tables.js
const express = require('express');
const router = express.Router();
const Table = require('../models/table');
const DiningSession = require('../models/diningSession');

// ✅ Regex để kiểm tra định dạng số bàn (vd: A1, B12, 10)
const isValidTableNumber = (value) => /^[A-Za-z]*\d+$/.test(value.trim());

/* ------------------------ 🟩 1. Tạo mới bàn ------------------------ */
router.post('/', async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({ message: 'Thiếu thông tin bàn hoặc số ghế.' });
    }

    if (!isValidTableNumber(tableNumber)) {
      return res.status(400).json({ message: 'Số bàn phải có định dạng hợp lệ (vd: 1, A2, VIP10).' });
    }

    const exists = await Table.findOne({ tableNumber: tableNumber.trim() });
    if (exists) {
      return res.status(400).json({ message: `Bàn ${tableNumber} đã tồn tại.` });
    }

    const newTable = new Table({
      tableNumber: tableNumber.trim(),
      capacity: parseInt(capacity, 10),
    });

    await newTable.save();
    res.status(201).json(newTable);
  } catch (err) {
    console.error('❌ Error creating table:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------ 🟨 2. Lấy danh sách bàn ------------------------ */
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find();

    // ✅ Hàm parse an toàn
    const parseTableNumber = (table) => {
      const tableNumber = table.tableNumber || '';
      const match = tableNumber.match(/^([a-zA-Z]*)(\d+)$/);
      if (match) {
        const [, prefix = '', number] = match;
        return { prefix, number: parseInt(number, 10) };
      }
      // Nếu không match: mặc định prefix rỗng, số = 0
      return { prefix: '', number: 0 };
    };

    // ✅ Sort bàn theo prefix + số
    tables.sort((a, b) => {
      const aParsed = parseTableNumber(a);
      const bParsed = parseTableNumber(b);
      if (aParsed.prefix === bParsed.prefix) {
        return aParsed.number - bParsed.number;
      }
      return aParsed.prefix.localeCompare(bParsed.prefix);
    });

    // ✅ Gắn trạng thái session hiện tại (nếu có)
    const tablesWithSessions = await Promise.all(
      tables.map(async (table) => {
        const activeSession = await DiningSession.findOne({
          table: table._id,
          status: 'active',
        });
        return {
          ...table.toObject(),
          activeSession: activeSession || null,
        };
      })
    );

    res.status(200).json(tablesWithSessions);
  } catch (err) {
    console.error('❌ Error fetching tables:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ------------------------ 🟥 3. Xóa bàn ------------------------ */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Kiểm tra xem bàn có session chưa hoàn thành không
    const activeSession = await DiningSession.findOne({
      table: id,
      status: { $ne: 'completed' },
    });

    if (activeSession) {
      return res.status(400).json({
        message: 'Bàn đang được sử dụng, không thể xóa.',
      });
    }

    const deletedTable = await Table.findByIdAndDelete(id);

    if (!deletedTable) {
      return res.status(404).json({ message: 'Không tìm thấy bàn cần xóa.' });
    }

    res.status(200).json({
      message: `Đã xóa bàn ${deletedTable.tableNumber}`,
      table: deletedTable,
    });
  } catch (err) {
    console.error('❌ Error deleting table:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
