
const path = require("path");
if (process.env.NODE_ENV !== "production") {

  require("dotenv").config({ path: path.join(__dirname, ".env") });
}

const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");
const compression = require("compression");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const adminRouter = require("./routes/admin.js");

const app = express();
app.set('trust proxy', 1);
const dbUrl = (process.env.NODE_ENV === "production")
  ? process.env.ATLASDB_URL
  : (process.env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust");



console.log("Database URL Check:", dbUrl ? "Loaded" : "Undefined");

if (!dbUrl) {
  console.error("CRITICAL ERROR: ATLASDB_URL is not defined in your .env file!");
  process.exit(1);
}


main().then(() => {
  console.log("Connected to MongoDB successfully");
}).catch((err) => console.log("DB Connection Error:", err));

async function main() {
  await mongoose.connect(dbUrl);
}


const allowedOrigin = process.env.NODE_ENV === "production"
  ? "https://wander-list-vw2z.vercel.app"
  : "http://localhost:5173";

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const store = MongoStore.create({
  mongoUrl: dbUrl,

  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  }
};



app.use(session(sessionOptions));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use("/api/listings", listingRouter);
app.use("/api/listings/:id/reviews", reviewRouter);
app.use("/api/auth", userRouter);

app.use("/api/admin", adminRouter);

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});


app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).json({
    success: false,
    error: message
  });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});