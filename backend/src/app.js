const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");

const app = express();

// 1. Security HTTP headers
app.use(helmet());

// 2. CORS configuration (allowing credentials & matching frontend url)
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
  })
);

// 3. HTTP Request Logging (dev format for local debug, combined for production logs)
if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// 4. Response compression (optimizes payload transport size)
app.use(compression());

// 5. Body Parsing with payload limits to prevent buffer overload attacks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6. Cookie parsing using signed cookie secret
app.use(cookieParser(env.cookieSecret));

// 7. Global API Rate Limiting to prevent DoS/brute-force attacks
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max 200 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});
// Apply rate limiter to all API endpoints
app.use("/api", globalLimiter);

// 8. Health check endpoint (verifies server and basic settings)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy and connected to MongoDB",
    timestamp: new Date(),
    environment: env.nodeEnv
  });
});

// --- Phase 2 routes registration ---
const authRouter = require("./routes/authRoutes");
const departmentRouter = require("./routes/departmentRoutes");
const userManagementRouter = require("./routes/userManagementRoutes");
const emissionFactorRouter = require("./routes/emissionFactorRoutes");

app.use("/api/auth", authRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/users", userManagementRouter);
app.use("/api/emission-factors", emissionFactorRouter);

// 9. 404 Route Handler for undefined endpoints
app.use((req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on this server`);
  error.statusCode = 404;
  next(error);
});

// 10. Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
  
  // Format Mongoose ValidationErrors or other sub-errors if present
  let formattedErrors = [];
  if (err.errors) {
    if (Array.isArray(err.errors)) {
      formattedErrors = err.errors;
    } else {
      formattedErrors = Object.keys(err.errors).map((key) => ({
        field: key,
        message: err.errors[key].message,
      }));
    }
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error occurred",
    errors: formattedErrors,
    ...(env.nodeEnv === "development" && { stack: err.stack })
  });
});

module.exports = app;
