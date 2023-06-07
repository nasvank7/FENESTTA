require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const nocache = require("nocache");
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
app.listen(3000, (req, res) => {
  console.log("server is started");
});
