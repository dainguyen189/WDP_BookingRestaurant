const cookieParser = require("cookie-parser");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const errorMiddleware = require("./middlewares/errorMiddleware");

const menuCategoryRoutes = require("./routes/menuCategoryRoutes");
const menuItemRoutes = require("./routes/menuItemRoutes");

const diningSessionRoutes = require("./routes/diningSessionRoutes");
const tableRoutes = require("./routes/tableRoutes");
const orderItemRoutes = require("./routes/orderItemRoutes");
const chefRoutes = require("./routes/chefRoutes");
const promotionRoutes = require("./routes/promotionRoute");
const staffRoutes = require("./routes/staffRoutes");
const orderRoutes = require("./routes/orderRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const payosRoutes = require("./routes/payosRoutes");

const app = express();

require("dotenv").config();
require("./cron-job/expireReservationsJob");

app.use(express.json());
app.use(cookieParser());

// Cấu hình CORS để cho phép credentials (cookies)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // URL của frontend
    credentials: true, // Quan trọng cho việc gửi cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
// Serve static uploads (local images fallback)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const connectDb = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    console.log(
      "📦 MONGO_URI:",
      process.env.MONGO_URI ? "Loaded ✅" : "❌ Missing",
    );

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed: ", error);
    process.exit(1);
  }
};

app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));
app.use("/api/reservation", require("./routes/reservation.route"));
app.use("/api/zalopay", require("./routes/zaloPayRoutes"));

// app.use('/api/admin', require('./routes/AdminRoute'));
app.use("/api/menu-categories", menuCategoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/dining-sessions", diningSessionRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use("/api/orders", orderRoutes);
app.use("/api/order-items", orderItemRoutes);

app.use("/api/chef", chefRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/payos", payosRoutes);

// middlewares
app.use(errorMiddleware);
app.use("/api/staff", staffRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  connectDb();
  console.log(`Server is running on port ${PORT}`);
});
