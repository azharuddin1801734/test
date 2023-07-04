const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updated_by: {
      type: String,
    },
    updated_on: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    messages: [
      {
        _id: String,
        text: String,
        createdAt: Date,
        user: {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
          avatar: String,
        },
        image: String,
        sent: {
          type: Boolean,
          default: true,
        },
        received: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    strict: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
