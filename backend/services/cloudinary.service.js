const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // Make sure .env is loaded (ideally in index.js once)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ cloudinary is now configured and ready to use

exports.uploadImageBuffer = async (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }).end(buffer);
  });
};

exports.deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted:', result);
    return result;
  } catch (error) {
    console.error('Deletion failed:', error);
    throw error;
  }
}
