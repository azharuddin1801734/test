const moment = require("moment");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const Specialist = require("../models/specialistModel");
const { filterObj } = require("./utils");
const Host = require("../models/hostModel");
const Order = require("../models/orderModel");
const Chat = require("../models/chatModel");
const { uploadMedia, uploadImage } = require("./imageUtils");

exports.uploadUserPhoto = uploadImage.single("photo");

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "Use /updatePassword to update password, this endpoint does not handle that",
        400
      )
    );
  }
  const filteredObj = filterObj(
    req.body,
    "searchRadius",
    "searchLocation",
    "searchStylesFor",
    "searchProGender",
    "phone",
    "bio",
    "firstName",
    "lastName",
    "gender"
  );

  if (req.file) {
    filteredObj.photo = req.file.linkUrl;
  }
  const user = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    message: "User info successfully updated",
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    message: "Account successfully deleted",
    data: null,
  });
});

exports.getMyInfo = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    status: "success",
    message: "Here is your account",
    data: {
      user,
    },
  });
});

exports.becomeSpecialist = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { role: "PRO", isSpecialist: true },
    { new: true, runValidators: true }
  );
  const specialist = await Specialist.create({
    user: user,
    distance: req.body.distance,
    location: {
      coordinates: user.searchLocation.coordinates,
    },
  });

  res.status(201).json({
    status: "success",
    message: "You have become a specialist",
    data: {
      specialist,
    },
  });
});

exports.becomeHost = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { role: "PRO", isHost: true },
    { new: true, runValidators: true }
  );
  const host = await Host.create({ user });
  res.status(201).json({
    status: "success",
    message: "You have become a host",
    data: {
      host,
    },
  });
});

exports.getUserCurrentRequests = catchAsync(async (req, res, next) => {
  // console.log("check_id", req.user.id);
  const orders = await Order.find({
    isPaid: true,
    client: req.user.id,
  })
  .sort("-createdAt")
    .populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      { path: "specialist", populate: ["services", "User"] },
      "client",
    ]);

  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});
exports.uploadImageMessage = uploadMedia.single("resource");

exports.sendMessage = catchAsync(async (req, res, next) => {
  const chat = await Chat.findOneAndUpdate(
    { order: req.params.order },
    {
      $push: {
        messages: {
          _id: `${req.body.sender}-${moment(req.body.createdAt).toDate()}-${
            req.body._id ? req.body._id : ""
          }`,
          text: req.body.text ? req.body.text : null,
          createdAt: moment(req.body.createdAt).toDate(),
          image: req.file ? req.file.linkUrl : null,
          sent: req.body.sent || true,
          received: req.body.received || true,
          user: {
            _id: req.body.sender,
            name: req.body.isClient
              ? `client-${req.body.sender}`
              : `specialist-${req.body.sender}`,
            avatar: req.body.avatar || "",
          },
        },
      },
    },
    { new: true, runValidators: true }
  );

  // console.log("check_chat>>>>>><<<<<<<",chat);
  // return false;

  res.status(200).json({
    status: "success",
    data: {
      chat,
    },
  });
});

exports.getConversations = catchAsync(async (req, res, next) => {
  const conversations = await Chat.find({
    $or: [
      { user1: new mongoose.Types.ObjectId(req.user) },
      { user2: new mongoose.Types.ObjectId(req.user) },
    ],
  }).populate([
    "user1",
    "user2",
    {
      path: "order",
      populate: ["client", { path: "specialist", populate: ["user"] }],
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      conversations,
    },
  });
});

exports.getMessages = catchAsync(async (req, res, next) => {
  const chat = await Chat.aggregate([
    { $match: { order: new mongoose.Types.ObjectId(req.params.order) } },
    { $unwind: "$messages" },
    { $sort: { "messages.createdAt": -1 } },
    { $group: { _id: "$_id", messages: { $push: "$messages" } } },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      chat,
    },
  });
});
