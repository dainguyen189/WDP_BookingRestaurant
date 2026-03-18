const multer = require('multer');

const storage = multer.memoryStorage(); // Store file in memory as a buffer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // max file size: 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept any image/* mimetype to avoid client/browser-specific subtype issues
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
