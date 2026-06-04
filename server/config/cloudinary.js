const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat-app/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat-app/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
  },
});

const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat-app/files',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    resource_type: 'raw',
  },
});

const uploadImage  = multer({ storage: imageStorage,  limits: { fileSize: 5  * 1024 * 1024 } });
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 2  * 1024 * 1024 } });
const uploadFile   = multer({ storage: fileStorage,   limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadImage, uploadAvatar, uploadFile };
