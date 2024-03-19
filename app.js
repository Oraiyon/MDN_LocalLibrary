const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const catalogRouter = require("./routes/catalog");

// Install dotenv to access .env
const dotenv = require("dotenv");
dotenv.config();

const app = express();
// Listens to railway port OR 8080
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0");

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
// Keep url private in .env
const main = async () => {
  try {
    await mongoose.connect(process.env.URL);
  } catch (err) {
    console.log(err);
  }
};
main();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Security middlewars
app.use(compression());
app.use(helmet());
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20
});
app.use(limiter);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
