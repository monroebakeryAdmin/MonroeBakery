import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

console.log("BUSINESS_EMAIL:", process.env.BUSINESS_EMAIL);
console.log("BUSINESS_PASS loaded:", !!process.env.BUSINESS_PASS);


const app = express();
app.use(cors());
app.use(express.json());

// connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ Mongo error:", err));

// routes
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
