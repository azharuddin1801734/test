const multerGoogleStorage = require("multer-cloud-storage");
const multer = require("multer");
const AppError = require("../utils/appError");

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, please upload an image", 400), false);
  }
};

const multerFilterMedia = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(
      new AppError("Not an image, please upload an image or a video", 400),
      false
    );
  }
};

const uploadOptions = {
  storage: multerGoogleStorage.storageEngine({
    autoRetry: true,
    projectId: "freshr-44d1a",
    bucket: "freshr-44d1a.appspot.com",
    // keyFilename: "./keys.json",
    credentials: {
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, "\n") : "GOOGLE_PRIVATE_KEY  is empty",
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID2,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_PROVIDER,
      client_x509_cert_url: process.env.GOOGLE_CLIENT,
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `pro-${req.user.id}-${Date.now()}.${ext}`);
    },
    limits: { fileSize: 5242880 }, // 5MB file size limit,
  }),
};

exports.uploadImage = multer({
  ...uploadOptions,
  fileFilter: multerFilter,
});

exports.uploadMedia = multer({
  ...uploadOptions,
  fileFilter: multerFilterMedia,
});
