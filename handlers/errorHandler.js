const AppError = require("../utils/appError");

const handleCastErrorDB = (err) =>
  new AppError(`Invalid value ${err.path}: ${err.value}`, 400);

const handleDuplicateValueErrorDB = (err) => {
  const key = Object.keys(err.keyPattern)[0];
  const value = err.keyValue[key];
  return new AppError(`Duplicated value ${key} : ${value}`, 400);
};

const handleValidationErrorDB = (err) => {
  const keys = Object.keys(err.errors);
  const messages = keys.map((key) => `${key}: ${err.errors[key]}`);
  return new AppError(`${messages.join(". ")}`, 400);
};

const handleJwtError = () =>
  new AppError("Invalid token please login again", 401);
const handleJwtExpiredError = () =>
  new AppError("Your token has expired, please login again", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    stack: err.stack,
    error: err,
    message: err.message,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log("Error", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  let error = { ...err };

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateValueErrorDB(error);
    if (err.name === "ValidationError")
      error = handleValidationErrorDB(error, res);
    if (err.name === "JsonWebTokenError") error = handleJwtError();
    if (err.name === "TokenExpiredError") error = handleJwtExpiredError();

    sendErrorProd(error, res);
  }
};
