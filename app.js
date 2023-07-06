const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");

// const hpp = require("hpp");
const path = require("path");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./handlers/errorHandler");
const serviceCategoryRouter = require("./routes/serviceCategoryRoutes");
const serviceTypeRouter = require("./routes/serviceTypeRoutes");
const serviceRouter = require("./routes/serviceRoutes");
const userRouter = require("./routes/userRoutes");
const specialistRouter = require("./routes/specialistRoutes");
const hostRouter = require("./routes/hostRoutes");
const orderRouter = require("./routes/orderRoutes");

const app = express();

// Middlewares
app.use(helmet());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// TODO: implement rate-limiting for api and authentication
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());
app.use(xss());
// app.use(hpp({ whitelist: []}));
app.get('/', (req, res) => {
  res.send('Welcome to Freshr-App');
});

app.use("/api/v1/filters/serviceCategories", serviceCategoryRouter);
app.use("/api/v1/filters/serviceTypes", serviceTypeRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/services", serviceRouter);
app.use("/api/v1/specialists", specialistRouter);
app.use("/api/v1/hosts", hostRouter);
app.use("/api/v1/orders", orderRouter);

app.all("*", (req, res, next) => {
  const error = new AppError(
    `Can't find ${req.originalUrl} on this server`,
    404
  );
  next(error);
});

app.use(globalErrorHandler);

module.exports = app;
