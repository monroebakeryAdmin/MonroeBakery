import { connectDB } from "./db.js";
import Order from "../backend/models/Order.js";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    try {
      const { name, email, phone, items, dateNeeded, message } = req.body;

      if (!name || !email || !phone || !items || !dateNeeded) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      // save order
      const newOrder = await Order.create({
        name,
        email,
        phone,
        items,
        dateNeeded,
        message
      });

      // email transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.BUSINESS_EMAIL,
          pass: process.env.BUSINESS_PASS
        },
      });

      await transporter.sendMail({
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
      });

      return res.status(201).json({ message: "Order received!" });

    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // update order
  if (req.method === "PUT") {
    try {
      const { id } = req.query;
      const { status } = req.body;

      const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
      if (!order) return res.status(404).json({ message: "Order not found" });

      return res.json(order);

    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // fallback
  res.status(405).json({ message: "Method not allowed" });
}
