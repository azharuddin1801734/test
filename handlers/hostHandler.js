const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const Host = require("../models/hostModel");
const AppError = require("../utils/appError");
const Facility = require("../models/facilityModel");
const { uploadImage } = require("./imageUtils");
const { filterObj } = require("./utils");
const Order = require("../models/orderModel");

exports.getAllHosts = catchAsync(async (req, res, next) => {
  const hosts = await Host.find().populate("user");
  res.status(200).json({
    status: "success",
    data: {
      hosts,
    },
  });
});

exports.getOneHost = catchAsync(async (req, res, next) => {
  const host = await Host.findById(req.params.id);
  if (!host) {
    return next(new AppError("Host not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      host,
    },
  });
});

exports.restrictToHost = catchAsync(async (req, res, next) => {
  const host = await Host.findOne({ user: req.user.id });

  // console.log("check_user>>>>", req.user.id);
  // console.log("check_host", host);
  // return false;
  if (!host) {
    console.log("No host associated with account");
    return next(new AppError("No host associated with account", 404));
  }
  req.proHost = host;
  next();
});

exports.getSelfSHost = catchAsync(async (req, res, next) => {
  const host = await Host.findById(req.proHost.id)
    .populate("user facilities")
    .select("+plan +planStart +planEnd");
  if (!host) {
    return next(new AppError("Specialist not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      host,
    },
  });
});

exports.getHostFacilities = catchAsync(async (req, res, next) => {
  const facilities = await Facility.find({ host: req.proHost.id });
  res.status(200).json({
    status: "success",
    message: "Facilities retrieved",
    results: facilities.length,
    data: {
      facilities,
    },
  });
});

exports.uploadFacilityGallery = uploadImage.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "gallery", maxCount: 6 },
]);

exports.createFacility = catchAsync(async (req, res, next) => {
  // console.log("check_body_data", req);
  // return false;

  const closingTime = new Date(req.body.closingTime);
  const openingTime = new Date(req.body.openingTime);
  const closingAt = `${closingTime.getHours()}:${closingTime.getMinutes()}`;
  const openingAt = `${openingTime.getHours()}:${openingTime.getMinutes()}`;

  const facilityObj = {
    host: req.proHost,
    name: req.body.name,
    coverImage: req.files.coverImage[0].linkUrl,
    region: req.body.region,
    country: req.body.country,
    street: req.body.street,
    city: req.body.city,
    location: JSON.parse(req.body.coords),
    address: `${req.body.postcode || ""} ${req.body.city || ""}, ${
      req.body.street || ""
    }, ${req.body.region || ""} ${req.body.country || ""}`,
    postcode: req.body.postcode,
    openingTime: openingTime,
    closingTime: closingTime,
    closingAt,
    openingAt,
    description: req.body.description,
    isOperational: true,
    seatCapacity: req.body.seatCapacity,
    availableSeats: req.body.seatCapacity,
    gallery: req.files.gallery.map((file) => file.linkUrl),
  };

  const facility = await Facility.create(facilityObj);
  res.status(201).json({
    status: "success",
    message: "Facility successfully created",
    data: {
      facility,
    },
  });
});

exports.updateFacility = catchAsync(async (req, res, next) => {
  const filteredObj = filterObj(
    req.body,
    "name",
    "description",
    "seatCapacity",
    "openingTime",
    "closingTime"
  );
  if (req.files) {
    if (req.files.coverImage) {
      filteredObj.coverImage = req.files.coverImage[0].linkUrl;
    }
    if (req.files.gallery) {
      filteredObj.gallery = req.files.gallery.map((file) => file.linkUrl);
    }
  }
  const facility = await Facility.findByIdAndUpdate(
    req.params.id,
    filteredObj,
    { new: true, runValidators: true }
  );

  if (!facility) {
    return next(new AppError("Facility not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Facility updated successfully",
    data: {
      facility,
    },
  });
});

exports.getHistoryFacility = catchAsync(async (req, res, next) => {
  const facilities = await Facility.find({ host: req.proHost.id });
  const orders = await Order.find({
    facility: { $in: facilities.map((facility) => facility.id) },
    status: "COMPLETED",
  })
    .sort("-createdAt")
    .populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      {
        path: "specialist",
        populate: ["services", "frontQueue", "backQueue"],
      },
      "client",
    ]);

  res.status(200).json({
    status: "success",
    data: { orders },
  });
});

exports.getFacilityBookingHistory = catchAsync(async (req, res, next) => {
  const orders = await Order.find({
    facility: req.params.id,
    status: "COMPLETED",
  })
    .sort("-createdAt")
    .populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      { path: "specialist", populate: ["services", "frontQueue", "backQueue"] },
      "client",
    ]);

  res.status(200).json({
    status: "success",
    data: { orders },
  });
});
