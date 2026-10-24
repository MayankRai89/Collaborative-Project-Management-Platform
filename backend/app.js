require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://collaborative-project-management-pl.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl or postman) or matching allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Normalize redundant leading slashes in incoming requests (e.g. //api/auth/login -> /api/auth/login)
app.use((req, res, next) => {
  if (req.url && req.url.startsWith("//")) {
    req.url = req.url.replace(/^\/+/, "/");
  }
  next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.use(errorHandler); // must be last

module.exports = app;
