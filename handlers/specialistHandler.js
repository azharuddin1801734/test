const mongoose = require("mongoose");
const { storage } = require("firebase-admin");
const catchAsync = require("../utils/catchAsync");
const Specialist = require("../models/specialistModel");
const AppError = require("../utils/appError");
const ServiceType = require("../models/serviceTypeModel");
const Service = require("../models/serviceModel");
const { filterObj } = require("./utils");
const Story = require("../models/storyModel");
const { uploadImage, uploadMedia } = require("./imageUtils");
const Order = require("../models/orderModel");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const Facility = require("../models/facilityModel");
const { sendNotification } = require("../utils/notification");

exports.getAllSpecialists = catchAsync(async (req, res, next) => {
  const specialists = await Specialist.find().populate("user");
  res.status(200).json({
    status: "success",
    data: {
      specialists: specialists,
    },
  });
});

exports.getServiceStats = catchAsync(async (req, res, next) => {
  const orders = await Order.find({
    specialist: new mongoose.Types.ObjectId(req.specialist),
    services: new mongoose.Types.ObjectId(req.params.id),
    status: "COMPLETED",
  });
  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});

exports.getOneSpecialist = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findById(req.params.id)
    .populate(["user", "services"])
    .select("-queue");
  if (!specialist) {
    return next(new AppError("Specialist not found", 404));
  }

  const profitPerOrderStatus = await Order.aggregate([
    { $match: { specialist: new mongoose.Types.ObjectId(specialist) } },
    {
      $group: {
        _id: "$status",
        total: {
          $sum: "$price",
        },
      },
    },
  ]);

  const profitPerDay = await Order.aggregate([
    { $match: { specialist: new mongoose.Types.ObjectId(specialist) } },
    {
      $group: {
        _id: {
          status: "$status",
          day: { $dayOfYear: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        total: { $sum: "$price" },
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      specialist,
      profitPerOrderStatus,
      profitPerDay,
    },
  });
});

exports.getSelfSpecialist = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findOne({ user: req.user.id })
    .populate(["user", "services"])
    .select("-queue +plan +planStart +planEnd +isQueueing");
  if (!specialist) {
    return next(new AppError("Specialist not found", 404));
  }
  const profitPerOrderStatus = await Order.aggregate([
    { $match: { specialist: new mongoose.Types.ObjectId(specialist) } },
    {
      $group: {
        _id: "$status",
        total: {
          $sum: "$price",
        },
      },
    },
  ]);

  const profitPerDay = await Order.aggregate([
    { $match: { specialist: new mongoose.Types.ObjectId(specialist) } },
    {
      $group: {
        _id: {
          day: { $dayOfYear: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        total: { $sum: "$price" },
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      specialist,
      profitPerOrderStatus,
      profitPerDay,
    },
  });
});

exports.deleteSpecialist = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findOneAndUpdate(
    { user: req.user.id },
    { isActive: false },
    { new: true }
  );
  if (!specialist) {
    return next(new AppError("Specialist not found", 404));
  }
  res.status(204).json({
    status: "success",
    message: "Specialist account deleted",
  });
});

exports.uploadSpecialistPhoto = uploadImage.single("photo");

exports.updateSpecialist = catchAsync(async (req, res, next) => {
  const filteredObj = filterObj(req.body, "bio", "distance", "location");

  let user = null;
  const userFilteredObj = filterObj(
    req.body,
    "firstName",
    "lastName",
    "gender"
  );
  if (req.file) {
    userFilteredObj.photo = req.file.linkUrl;
  }
  user = await User.findByIdAndUpdate(req.specialist.user, userFilteredObj, {
    new: true,
    runValidators: true,
  });

  const specialist = await Specialist.findByIdAndUpdate(
    req.specialist.id,
    filteredObj,
    {
      new: true,
      runValidators: true,
    }
  ).populate([
    "user",
    { path: "services", populate: ["serviceType"] },
    "frontQueue",
    "backQueue",
  ]);
  res.status(200).json({
    status: "success",
    message: "Specialist successfully updated",
    data: {
      specialist,
      user,
    },
  });
});

exports.restrictToSpecialist = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findOne({ user: req.user.id });
  if (!specialist) {
    return next(new AppError("No specialist associated with account", 404));
  }
  req.specialist = specialist;
  next();
});

// const multerStorage = multer.diskStorage({
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(
//       null,
//       `specialist-${req.user.id}-${req.specialist.id}-${Date.now()}.${ext}`
//     );
//   },
// });

exports.uploadServicePhoto = uploadImage.single("photo");
exports.uploadStoryPhoto = uploadMedia.single("resource");

exports.createService = catchAsync(async (req, res, next) => {
  const serviceType = await ServiceType.findById(req.body.serviceType);
  if (!serviceType) {
    return next(new AppError("Service type  ot found", 400));
  }

  const serviceObj = {
    specialist: req.specialist,
    serviceType,
    description: req.body.description,
    photo: req.file ? req.file.linkUrl : req.body.photo,
    forMale: req.body.forMale || false,
    forFemale: req.body.forFemale || false,
    price: req.body.price,
  };

  if (req.body.duration) {
    serviceObj.estimatedDuration = {
      hours: 0,
      minutes: req.body.duration,
      totalMinutes: req.body.duration,
    };
  }

  const service = await Service.create({ ...serviceObj });

  res.status(201).json({
    status: "success",
    message: "Service successfully created",
    data: {
      service,
    },
  });
});

exports.getServices = catchAsync(async (req, res, next) => {
  const services = await Service.find({ specialist: req.specialist }).populate(
    "serviceType"
  );

  res.status(200).json({
    status: "success",
    message: "Services list",
    results: services.length,
    data: {
      services,
    },
  });
});

exports.getHistory = catchAsync(async (req, res, next) => {
  const orders = await Order.find({
    isPaid: true,
    specialist: req.specialist.id,
    status: "COMPLETED",
  })
    .sort("-createdAt")
    .populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      {
        path: "specialist",
        populate: ["user", "services", "frontQueue", "backQueue"],
      },
      "client",
    ]);

  res.status(200).json({
    status: "success",
    data: { orders },
  });
});

// Before refactoring:
function doMultipleOperations(req, res) {
  const data = req.body;

  // Operation 1
  // ...

  // Operation 2
  // ...

  // Operation 3
  // ...
}

// After refactoring:
function doMultipleOperations(req, res) {
  const data = req.body;

  // Call utility functions to perform each operation
  const result1 = performOperation1(data);
  const result2 = performOperation2(data);
  const result3 = performOperation3(data);

  // Return results
  res.json({ result1, result2, result3 });
}

// Utility functions
function performOperation1(data) {
  // ...
}

function performOperation2(data) {
  // ...
}

function performOperation3(data) {
  // ...
}

exports.getCurrentRequests = catchAsync(async (req, res, next) => {
  // const fromDate = req.specialist.availableFrom
  //   ? req.specialist.availableFrom
  //   : req.specialist.createdAt;
  // const orders = await Order.find({
  //   isPaid: true,
  //   specialist: req.specialist.id,
  // })
  //   .sort("-createdAt")
  //   .populate([
  //     { path: "services", populate: ["serviceType"] },
  //     "facility",
  //     { path: "specialist", populate: ["services", "frontQueue", "backQueue"] },
  //     "client",
  //   ]);

  const queue = [];
  if (req.specialist.frontQueue) {
    let currentOrder = await Order.findById(req.specialist.frontQueue).populate(
      [
        { path: "services", populate: ["serviceType"] },
        "facility",
        {
          path: "specialist",
          populate: ["services", "frontQueue", "backQueue"],
        },
        "client",
      ]
    );
    queue.push(currentOrder);
    while (currentOrder.afterOrder) {
      // eslint-disable-next-line no-await-in-loop
      currentOrder = await Order.findById(currentOrder.afterOrder).populate([
        { path: "services", populate: ["serviceType"] },
        "facility",
        {
          path: "specialist",
          populate: ["services", "frontQueue", "backQueue"],
        },
        "client",
      ]);
      queue.push(currentOrder);
    }
  }

  const results = { queue };

  res.status(200).json({
    status: "success",
    data: { ...results },
  });
});

exports.acceptOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.order).populate([
    { path: "services", populate: ["serviceType"] },
    "facility",
    { path: "specialist", populate: ["services"] },
    "client",
  ]);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }
  const specialist = await Specialist.findById(req.specialist.id).populate([
    "services",
    "user",
  ]);
  const facility = await Facility.findById(order.facility.id);

  if (order.status !== "PENDING") {
    return next(new AppError("Order was not pending", 400));
  }
  if (`${order.id}` !== `${specialist.frontQueue}`) {
    return next(
      new AppError(
        `Order is not at the front of queue. Decide on the ${order.position} requests before.`
      )
    );
  }
  specialist.isBusy = true;
  order.status = "IN_TRAFFIC";
  order.startCode = `${Math.floor(1000 + Math.random() * 9000)}`;
  facility.availableSeats = Number.isNaN(facility.availableSeats)
    ? facility.seatCapacity - 1
    : facility.availableSeats - 1;
  await specialist.save();
  await facility.save();
  await order.save();

  const queue = [];
  if (specialist.frontQueue) {
    let currentOrder = await Order.findById(specialist.frontQueue).populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      {
        path: "specialist",
        populate: ["user", "services", "frontQueue", "backQueue"],
      },
      "client",
    ]);
    queue.push(currentOrder);
    while (currentOrder.afterOrder) {
      // eslint-disable-next-line no-await-in-loop
      currentOrder = await Order.findById(currentOrder.afterOrder).populate([
        { path: "services", populate: ["serviceType"] },
        "facility",
        "specialist",
        "client",
      ]);
      queue.push(currentOrder);
    }
  }

  let results = {
    order,
    specialist,
  };
  results = { ...results, queue };

  await sendNotification(
    order.client.pushToken,
    "Info on recent order",
    `Your order has been accepted by specialist meetup at ${order.facility.address} to be serviced.`
  );

  res.status(200).json({
    status: "success",
    message: "Order has been accepted",
    data: { ...results },
  });
});

exports.startOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.order).populate([
    { path: "services", populate: ["serviceType"] },
    "facility",
    {
      path: "specialist",
      populate: ["user", "services", "frontQueue", "backQueue"],
    },
    "client",
  ]);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }
  const specialist = await Specialist.findById(req.specialist.id).populate([
    "services",
    "user",
  ]);
  if (specialist.id !== req.specialist.id) {
    return next(
      new AppError(
        "You don't have the right to start this order. Wrong professional",
        400
      )
    );
  }

  if (req.params.code !== order.startCode) {
    return next(new AppError(`Wrong code`, 400));
  }

  if (order.status !== "IN_TRAFFIC") {
    return next(new AppError("Order was not in traffic", 400));
  }
  if (`${order.id}` !== `${specialist.frontQueue}`) {
    return next(
      new AppError(
        `Order is not at the front of queue. Decide on the ${order.position} requests before.`
      )
    );
  }
  order.status = "ONGOING";
  order.endCode = `${Math.floor(1000 + Math.random() * 9000)}`;
  await order.save();

  const queue = [];
  if (specialist.frontQueue) {
    let currentOrder = await Order.findById(specialist.frontQueue).populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      {
        path: "specialist",
        populate: ["user", "services", "frontQueue", "backQueue"],
      },
      "client",
    ]);
    queue.push(currentOrder);
    while (currentOrder.afterOrder) {
      // eslint-disable-next-line no-await-in-loop
      currentOrder = await Order.findById(currentOrder.afterOrder).populate([
        { path: "services", populate: ["serviceType"] },
        "facility",
        {
          path: "specialist",
          populate: ["user", "services", "frontQueue", "backQueue"],
        },
        "client",
      ]);
      queue.push(currentOrder);
    }
  }
  let results = {
    order,
    specialist,
  };
  results = { ...results, queue };

  // await sendNotification(
  //   specialist.user.pushToken,
  //   "New order",
  //   `You have a new order at ${facility.address}`
  // );
  await sendNotification(
    order.client.pushToken,
    "Info on recent order",
    `Your order has started. Good servicing`
  );

  res.status(200).json({
    status: "success",
    message: "Order has been started",
    data: { ...results },
  });
});

exports.completeOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.order).populate([
    { path: "services", populate: ["serviceType"] },
    "facility",
    {
      path: "specialist",
      populate: ["services", "user", "services", "frontQueue", "backQueue"],
    },
    "client",
  ]);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }
  const specialist = await Specialist.findById(req.specialist.id).populate([
    "services",
    "user",
  ]);
  const facility = await Facility.findById(order.facility.id);

  if (specialist.id !== req.specialist.id) {
    return next(
      new AppError(
        "You don't have the right to start this order. Wrong professional",
        400
      )
    );
  }

  if (req.params.code !== order.endCode) {
    return next(new AppError("Wrong code", 400));
  }

  if (order.status !== "ONGOING") {
    return next(new AppError("Order was not ONGOING", 400));
  }

  if (`${order.id}` !== `${specialist.frontQueue}`) {
    return next(
      new AppError(
        `Order is not at the front of queue. Decide on the ${order.position} requests before.`
      )
    );
  }
  specialist.queue -= 1;
  specialist.frontQueue = order.afterOrder;
  if (order.afterOrder) {
    await Order.findByIdAndUpdate(order.afterOrder, { beforeOrder: null });
    let frontOrder = await Order.findById(order.afterOrder);
    while (frontOrder) {
      frontOrder.position -= 1;
      frontOrder.save();
      if (frontOrder.afterOrder) {
        // eslint-disable-next-line no-await-in-loop
        frontOrder = await Order.findById(frontOrder.afterOrder);
      } else {
        frontOrder = null;
      }
    }
  }

  if (!specialist.frontQueue) {
    specialist.backQueue = null;
  }

  order.status = "COMPLETED";
  specialist.isBusy = false;
  facility.availableSeats = Number.isNaN(facility.availableSeats)
    ? facility.seatCapacity
    : facility.availableSeats + 1;

  await specialist.save();
  await facility.save();
  await order.save();
  await Chat.findByIdAndDelete(order.chatRoom);

  // SEND PAYMENT TO PROFESSIONAL

  const queue = [];
  if (specialist.frontQueue) {
    let currentOrder = await Order.findById(specialist.frontQueue).populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      {
        path: "specialist",
        populate: ["user", "services", "frontQueue", "backQueue"],
      },
      "client",
    ]);
    queue.push(currentOrder);
    while (currentOrder.afterOrder) {
      // eslint-disable-next-line no-await-in-loop
      currentOrder = await Order.findById(currentOrder.afterOrder).populate([
        { path: "services", populate: ["serviceType"] },
        "facility",
        "specialist",
        "client",
      ]);
      queue.push(currentOrder);
    }
  }
  let results = {
    order,
    specialist,
  };
  results = { ...results, queue };

  await sendNotification(
    specialist.user.pushToken,
    "You done !!",
    `Awesome, payment will be sent to your account.`
  );
  await sendNotification(
    order.client.pushToken,
    "Info on recent order",
    `Looking sharp. Please don't forget to rate the specialist and facility`
  );

  res.status(200).json({
    status: "success",
    message: "Order has been completed",
    data: { ...results },
  });
});

exports.rejectOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.order).populate([
    { path: "services", populate: ["serviceType"] },
    "facility",
    {
      path: "specialist",
      populate: ["services", "user", "services", "frontQueue", "backQueue"],
    },
    "client",
  ]);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }
  const specialist = await Specialist.findById(req.specialist.id).populate([
    "services",
    "user",
  ]);
  const facility = await Facility.findById(order.facility.id);

  if (!["PENDING", "IN_TRAFFIC"].includes(order.status)) {
    return next(new AppError("Order cannot be cancelled", 400));
  }
  if (`${order.id}` !== `${specialist.frontQueue}`) {
    return next(
      new AppError(
        `Order is not at the front of queue. Decide on the ${order.position} requests before.`
      )
    );
  }
  specialist.queue -= 1;
  specialist.frontQueue = order.afterOrder;
  if (order.afterOrder) {
    await Order.findByIdAndUpdate(order.afterOrder, { beforeOrder: null });
    let frontOrder = await Order.findById(order.afterOrder);
    while (frontOrder) {
      frontOrder.position -= 1;
      frontOrder.save();
      if (frontOrder.afterOrder) {
        // eslint-disable-next-line no-await-in-loop
        frontOrder = await Order.findById(frontOrder.afterOrder);
      } else {
        frontOrder = null;
      }
    }
  }
  if (!specialist.frontQueue) {
    specialist.backQueue = null;
  }
  specialist.isBusy = false;

  if (order.status === "IN_TRAFFIC") {
    facility.availableSeats = Number.isNaN(facility.availableSeats)
      ? facility.seatCapacity
      : facility.availableSeats + 1;
  }

  order.status = "CANCELLED";

  await specialist.save();
  await facility.save();
  await order.save();

  await Chat.findByIdAndDelete(order.chatRoom);

  const queue = [];
  if (specialist.frontQueue) {
    let currentOrder = await Order.findById(specialist.frontQueue).populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      {
        path: "specialist",
        populate: ["user", "services", "frontQueue", "backQueue"],
      },
      "client",
    ]);
    queue.push(currentOrder);
    while (currentOrder.afterOrder) {
      // eslint-disable-next-line no-await-in-loop
      currentOrder = await Order.findById(currentOrder.afterOrder).populate([
        { path: "services", populate: ["serviceType"] },
        "facility",
        {
          path: "specialist",
          populate: ["services", "user", "services", "frontQueue", "backQueue"],
        },
        "client",
      ]);
      queue.push(currentOrder);
    }
  }
  let results = {
    order,
    specialist,
  };
  results = { ...results, queue };

  await sendNotification(
    specialist.user.pushToken,
    "You reject it",
    `You might be penalized :)`
  );
  await sendNotification(
    order.client.pushToken,
    "Info on recent order",
    `Your order was rejected`
  );

  res.status(200).json({
    status: "success",
    message: "Order has been rejected",
    data: { ...results },
  });
});

exports.getStories = catchAsync(async (req, res, next) => {
  const stories = await Story.find({ specialist: req.specialist }).sort(
    "createdAt"
  );

  res.status(200).json({
    status: "success",
    message: "Stories list",
    results: stories.length,
    data: {
      stories,
    },
  });
});

exports.updateService = catchAsync(async (req, res, next) => {
  // if (req.body.serviceType) {
  //   return next(
  //     new AppError(
  //       "Delete service and create a new one matching service type",
  //       401
  //     )
  //   );
  // }
  const filteredObj = filterObj(
    req.body,
    "serviceType",
    "photo",
    "description",
    "price",
    "forMale",
    "forFemale"
  );
  if (req.file) filteredObj.photo = req.file.linkUrl;
  if (req.body.duration) {
    filteredObj.estimatedDuration = {
      hours: 0,
      minutes: req.body.duration,
      totalMinutes: req.body.duration,
    };
  }

  const service = await Service.findByIdAndUpdate(req.params.id, filteredObj, {
    new: true,
    runValidators: true,
  });
  if (!service) {
    return next(new AppError("Service not found", 404));
  }
  res.status(200).json({
    status: "success",
    message: "service successfully updated",
    data: {
      service,
    },
  });
});

exports.deleteService = catchAsync(async (req, res, next) => {
  await Service.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    message: "service successfully deleted",
  });
});

exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findOne({
    id: req.params.service,
    specialist: req.specialist.id,
  }).populate(["serviceType"]);
  if (!service) {
    return next(new AppError("Service not found", 404));
  }
  res.status(200).json({
    status: "success",
    message: "service successfully updated",
    data: {
      service,
    },
  });
});

exports.postStory = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("You have not uploaded a file"));
  }
  const story = await Story.create({
    specialist: req.specialist.id,
    resource: req.file.linkUrl,
    mediaType: req.body.mediaType,
    createdAt: Date.now(),
  });

  res.status(201).json({
    status: "success",
    message: "Story posted",
    data: {
      story,
    },
  });
});

exports.deleteStory = catchAsync(async (req, res, next) => {
  const story = await Story.findByIdAndDelete(req.params.id);
  // await storage
  //   .bucket("freshr-44d1a.appspot.com")
  //   .file(story.resource)
  //   .delete();

  res.status(204).json({
    status: "success",
    message: "Deleted story",
  });
});

exports.becomeAvailable = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findByIdAndUpdate(
    req.specialist.id,
    { isOnline: true, location: req.body.location, availableFrom: Date.now() },
    { new: true }
  ).populate(["user", "services"]);

  if (!specialist) {
    return next(new AppError("Specialist not found", 400));
  }

  res.status(200).json({
    status: "success",
    message: "You are now available",
    data: {
      specialist,
    },
  });
});

exports.becomeUnavailable = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findByIdAndUpdate(
    req.specialist.id,
    { isOnline: false, availableFrom: null },
    { new: true }
  ).populate(["user", "services"]);

  if (!specialist) {
    return next(new AppError("Specialist not found", 400));
  }

  res.status(200).json({
    status: "success",
    message: "You've become unavailable",
    data: {
      specialist,
    },
  });
});

exports.startQueue = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findByIdAndUpdate(
    req.specialist.id,
    { isQueueing: true, queue: 0 },
    { new: true }
  ).populate(["user", "services"]);

  if (!specialist) {
    return next(new AppError("Specialist not found", 400));
  }

  res.status(200).json({
    status: "success",
    message: "You are now using the queue",
    data: {
      specialist,
    },
  });
});

exports.stopQueue = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findByIdAndUpdate(
    req.specialist.id,
    { isQueueing: false, queue: 0 },
    { new: true }
  ).populate(["user", "services"]);

  if (!specialist) {
    return next(new AppError("Specialist not found", 400));
  }

  res.status(200).json({
    status: "success",
    message: "You've stop using the queue",
    data: {
      specialist,
    },
  });
});
