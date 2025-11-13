import express from "express";
import nodemailer from "nodemailer";
import Order from "../models/Order.js";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();



const router = express.Router();

// basic rate limiter: 1 order per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: { message: "Too many orders — please wait a minute before submitting another." }
});
router.use(limiter);
console.log("EMAIL:", process.env.BUSINESS_EMAIL);
console.log("PASS:", process.env.BUSINESS_PASS ? "Loaded ✅" : "❌ Missing");

// create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.BUSINESS_EMAIL,
    pass: process.env.BUSINESS_PASS
  },
  tls: {
    rejectUnauthorized: false // prevents some SSL cert issues
  }
});


// POST /api/orders
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, items, dateNeeded, message } = req.body;

    // ✅ Basic validation
    if (!name || !email || !phone || !items || !dateNeeded)
      return res.status(400).json({ message: "Missing required fields." });

    // ✅ Date guard (must be between 1 and 21 days from today)
    const today = new Date();
    const orderDate = new Date(dateNeeded);
    const diffDays = Math.ceil((orderDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 1 || diffDays > 21) {
      return res.status(400).json({
        message: "Invalid date. Orders must be placed at least 1 day in advance and no more than 3 weeks ahead."
      });
    }

    // Save order to Mongo
    const newOrder = new Order({ name, email, phone, items, dateNeeded, message });
    await newOrder.save();

    // Send email notification to bakery
    const mailOptions = {
      from: process.env.BUSINESS_EMAIL,
      to: process.env.BUSINESS_EMAIL,
      subject: `🧁 New Pre-Order from ${name}`,
      html: `
        <h3>New Pre-Order Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Items:</strong> ${items}</p>
        <p><strong>Date Needed:</strong> ${dateNeeded}</p>
        <p><strong>Message:</strong> ${message || "None"}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: "Order received and email sent!" });
  } catch (error) {
    console.error("❌ Order Error:", error);
    res.status(500).json({ message: "Server error" });
  }
  
});

// PUT /api/orders/:id/status (for approving/rejecting)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
