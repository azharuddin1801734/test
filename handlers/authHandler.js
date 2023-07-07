const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validator = require("validator");
const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const createJwtToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

const createAndSendJwtToken = (
  res,
  statusCode,
  message,
  payload,
  data = null
) => {
  const token = createJwtToken(payload);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    message: message,
    data: data,
    token: token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.formattedPhone,
    photo: req.body.photo,
    password: req.body.password,
    passwordConfirm: req.body.confirmPassword,
    location: req.body.location,
    gender: req.body.gender,
  });
  console.log("check_User>>>");
  createAndSendJwtToken(
    res,
    201,
    "User created successfully",
    { id: newUser.id },
    {
      user: newUser,
    }
  );
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  if (!validator.isEmail(email)) {
    return next(new AppError("Please provide a valid email address", 400));
  }

  const user = await User.findOne({ email: email }).select("+password");
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }

  const userInfo = { ...user._doc };
  delete userInfo.password;
  createAndSendJwtToken(
    res,
    200,
    "Login successfully",
    { id: user.id },
    {
      user: userInfo,
    }
  );
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("User not logged in. Please login to be granted access", 401)
    );
  }

  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  const user = await User.findById(decodedToken.id);

  if (!user) {
    return next(
      new AppError(
        "User associated with this token does not exists anymore",
        401
      )
    );
  }

  if (user.updatedPasswordAfter(decodedToken.iat)) {
    return next(
      new AppError("Password was recently updated, please login again", 401)
    );
  }

  req.user = user;

  next();
});

exports.restrictTo =
  (...roles) =>
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError("You do not have permission to perform this action", 403)
        );
      }
      next();
    };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user found with this email", 404));
  }
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `<p>Forgot your password? click on the following link to reset your password.\n<a href="${resetURL}" target="_blank">${resetURL}</a>\nIf you didn't forget your password, please ignore this email!</p>`;

  try {
    sendEmail({
      email: req.body.email,
      subject: "Reset password (valid for 10min)",
      message: message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.save({ validateBeforeSave: false });
    return next(
      new AppError("Reset token couldn't be sent, please try again.", 500)
    );
  }

  res.status(200).json({
    status: "success",
    message: "Token sent to email",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const token = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpiresIn: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 404));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetTokenExpiresIn = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  createAndSendJwtToken(res, 200, "password successfully reset", {
    id: user.id,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Wrong password provided", 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createAndSendJwtToken(res, 200, "password successfully updated", {
    id: user.id,
  });
});
