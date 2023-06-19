const express = require("express");
require("dotenv").config();
const path = require("path");
const bodyparser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const nocache = require("nocache");
const createError = require("http-errors");
const paypal = require("paypal-rest-sdk")
const userRouter = require("./server/routes/user");
const adminRouter = require("./server/routes/admin");
const paypalClientId = process.env.PaypalClientId;
const paypalSecret = process.env.paypalSecret;



const logger=require('morgan');


const app = express();
const db = require("./server/connection/connection");
app.use(logger('dev'))
app.set("view engine", "ejs");
app.use((req, res, next) => {
  res.header(
    "Cache-Control",
    "no-cache,private,no-Store,must-revalidate,max-scale=0,post-check=0,pre-check=0"
  );
  next();
});
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("uploads"));
app.use(
  session({
    secret: "secret",
    resave: "false",
    cookie: { sameSite: "strict" },
    saveUninitialized: false,
  })
);


app.use(bodyparser.urlencoded({ extended: false }));

app.use(userRouter);
app.use(adminRouter);
app.use(function (req, res, next) {
  next(createError(404));
  res.render('error')
});
app.use(function (error, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = error.message;
  res.locals.error = req.app.get("env") === "development" ? error : {};

  // render the error page
  res.status(error.status || 500);
  res.render("error");
});
app.listen(3000, (req, res) => {
  console.log("server is started");
});
