const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Expo } = require("expo-server-sdk");

const catchAsync = require("../utils/catchAsync");
const Service = require("../models/serviceModel");
const Facility = require("../models/facilityModel");
const AppError = require("../utils/appError");
const Order = require("../models/orderModel");
const Specialist = require("../models/specialistModel");
const Chat = require("../models/chatModel");
const { filterObj } = require("./utils");
const { sendNotification } = require("../utils/notification");
const mongoose = require("mongoose");


exports.payOrder = catchAsync(async (req, res, next) => {
 
    const order = await Order.findByIdAndUpdate(
      req.params.order,
      { isPaid: true },
      { new: true }
    ).populate([
      { path: "services", populate: ["serviceType"] },
      "facility",
      {
        path: "specialist",
        populate: ["User", "services", "frontQueue", "backQueue"],
      },
      "client",
    ]);
  // console.log("check_order>>>", order);
  // return

    // console.log("check_order_state>>>", order_state);
    // console.log("check_order>>>", order);
    // return false;

    // Find By Id -> order
    // order_state = order
    // order update -> isPaid=true, new=true

    // Find By Id -> specialist
    // specialist_state = specialist
    // if all ok -> update specialist -> queue+1

    // new Chat created
    // chat

    const specialist = await Specialist.findById(order.specialist.id).populate(
      "User"
    );

    if (specialist.isQueueing) {
      if (specialist.queue + 1 > specialist.maxQueue) {
        return next(new AppError("Max queue size exceeded"));
      }
    }
    // Update
    // Update the location field with a valid geo point
    specialist.queue += 1;
    specialist.save();
    // specialist_state.push(specialist);

    const facility = await Facility.findById(order.facility);
    // Update + Create
    const chat = await Chat.create({
      order: order.id,
      user1: order.client.id,
      user2: order.specialist.id,
      messages: [],
    });
    // chat_state.push(chat);

    order.afterOrder = null;
    let backOrder = null;
    if (specialist.backQueue) {
      backOrder = await Order.findById(specialist.backQueue);
      if (backOrder) {
        backOrder.afterOrder = order._id;
        // Update
        backOrder.save();
      }
      order.position = backOrder ? backOrder.position + 1 : 0;
      order.beforeOrder = specialist.backQueue;
    }

    order.chatRoom = chat.id;
    order.save();
    specialist.backQueue = order;
    if (!specialist.frontQueue) {
      specialist.frontQueue = order.id;
    }
    specialist.save();

    sendNotification(
      specialist.user.pushToken,
      "New order",
      `You have a new order at ${facility.address}`
    );
    sendNotification(
      order.client.pushToken,
      "Your new order",
      `Your order has been sent to specialist wait for approval and meetup at ${facility.address} to be serviced.`
    );

    res.status(201).json({
      status: "success",
      data: {
        order: order,
        chat: chat,
      },
    });
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const serviceIdList = req.params.services.split(",");

  const services = await Service.find({
    _id: { $in: [...serviceIdList] },
  }).populate(["specialist", "serviceType"]);

  if (services.length !== serviceIdList.length) {
    return next(new AppError("Problem finding all services", 404));
  }

  const specialist = await Specialist.findById(
    services[0].specialist.id
  ).populate("User");

  if (specialist.isQueueing) {
    if (specialist.queue + 1 > specialist.maxQueue) {
      return next(new AppError("Specialist is at full capacity"));
    }
  }

  if (!specialist.isQueueing) {
    if (specialist.queue >= 1) {
      return next(
        new AppError("Specialist is at full capacity, because not queue")
      );
    }
  }

  const facility = await Facility.findById(req.params.facility);

  if (!facility) {
    return next(new AppError("Problem finding facility", 404));
  }

  let customer = req.user.stripeCustomerId;

  if (!customer) {
    customer = await stripe.customers.create();
  }

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer },
    { apiVersion: "2020-08-27" }
  );

  const price =
    100 *
    services.reduce(
      (result, currentService) => result + currentService.price,
      0
    );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: price,
    currency: "usd",
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  //   clientTravelDistance: String,
  //   specialistTravelDistance: String,
  //   clientTravelTime: String,
  //   specialistTravelTime: String,
  //   servicingTotalTime: String,

  const filteredObj = filterObj(
    req.body,
    "clientTravelDistance",
    "specialistTravelDistance",
    "clientTravelTime",
    "specialistTravelTime",
    "servicingTotalTime"
  );

  const order = await (
    await Order.create({
      services,
      facility,
      price,
      client: req.user,
      status: "PENDING",
      specialist: services[0].specialist.id,
      isPaid: false,
      paymentIntent: paymentIntent.client_secret,
      paymentKey: ephemeralKey.secret,
      createdAt: Date.now(),
      ...filteredObj,
    })
  ).populate([
    { path: "services", populate: ["serviceType"] },
    "facility",
    {
      path: "specialist",
      populate: ["User", "services", "frontQueue", "backQueue"],
    },
    "client",
  ]);

  res.status(200).json({
    status: "success",
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    order,
  });
});
