const ServiceType = require("../models/serviceTypeModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllServiceTypes = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(ServiceType.find(), req.query);
  const serviceTypes = await features.filter().sort().limitFields().paginate()
    .query;

  res.status(200).json({
    status: "success",
    results: serviceTypes.length,
    data: {
      serviceTypes,
    },
  });
});

exports.getOneServiceType = catchAsync(async (req, res, next) => {
  const serviceType = await ServiceType.findById(req.params.id);
  if (!serviceType) {
    return next(new AppError("No service type found with provided ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      serviceType,
    },
  });
});

exports.createServiceType = catchAsync(async (req, res, next) => {
  const newServiceType = await ServiceType.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      serviceType: newServiceType,
    },
  });
});

exports.updateServiceType = catchAsync(async (req, res, next) => {
  const updatedServiceType = await ServiceType.findOneAndUpdate(
    { id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedServiceType) {
    return next(new AppError("No service type found with provided ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      serviceType: updatedServiceType,
    },
  });
});

exports.deleteServiceType = catchAsync(async (req, res, next) => {
  const deletedServiceType = await ServiceType.findByIdAndDelete(req.params.id);
  if (!deletedServiceType) {
    return next(new AppError("No service type found with provided ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
