const mongoose = require("mongoose");
const socketIo = require("socket.io");
const http = require("http");
// const ngrok = require("ngrok");
require("dotenv").config();
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

mongoose.set("strictQuery", false);
const DB = process.env.DATABASE.replace(
  "<USER>",
  process.env.DATABASE_USER
).replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(() => {
  console.log("DB connection successful");
});

const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = socketIo(server);
io.on("connect", (socket) => {
  const users = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [id, _socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: _socket.username,
    });
    console.log(users);
  }
  socket.emit("users", users);
  socket.broadcast.emit("user-connected", {
    userID: socket.id,
    username: socket.username,
  });

  socket.onAny((event, ...args) => {
    console.log(event, args);
  });

  socket.on("message", ({ content, from, to, order }) => {
    console.log(content);
    socket.broadcast.emit("message", {
      content,
      from,
      to,
      order,
    });
  });

  socket.on("is-typing", ({ content, to, from, order }) => {
    socket.broadcast.emit("is typing", {
      content,
      from,
      to,
      order,
    });
  });

  socket.on("stop-typing", ({ content, from, order, to }) => {
    console.log("stop typing");
    socket.broadcast.emit("stop typing", {
      content,
      from,
      to,
      order,
    });
  });

  socket.on("disconnect", () => {
    console.log(`disconnect: ${socket.id}`);
  });
});

io.use((socket, next) => {
  const { username } = socket.handshake.auth;
  if (!username) {
    return next(new Error("Invalid username"));
  }
  socket.username = username;
  next();
});

server.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// (options) => {
//   console.log(`App running on port ${port}`);
//   ngrok.connect(port).then((value) => console.log(value));
// }

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
console.log("check_server");
