import { connectDB } from "./db.js";
import Order from "../backend/models/Order.js";
import nodemailer from "nodemailer";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const pickupDate = req.body?.dateNeeded;
    const parsedPickupDate = typeof pickupDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(pickupDate)
      ? new Date(`${pickupDate}T00:00:00Z`)
      : null;
    if (!parsedPickupDate || Number.isNaN(parsedPickupDate.getTime()) || parsedPickupDate.toISOString().slice(0, 10) !== pickupDate) {
      return res.status(400).json({ message: "Please choose a valid pickup date.", orderSaved: false });
    }
    if (parsedPickupDate.getUTCDay() === 0) {
      return res.status(400).json({
        message: "We are closed on Sundays. Please choose a pickup date Monday through Saturday.",
        code: "SUNDAY_PICKUP",
        orderSaved: false
      });
    }

    try {
      await connectDB();
    } catch (err) {
      console.error("Order database unavailable:", err);
      return res.status(503).json({ message: "Order could not be saved.", orderSaved: false });
    }

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

      if (!process.env.BUSINESS_EMAIL || !process.env.BUSINESS_PASS) {
        console.error("Order saved, but BUSINESS_EMAIL or BUSINESS_PASS is not configured.");
        return res.status(201).json({
          message: "Order received; bakery email notification is not configured.",
          orderSaved: true,
          notificationSent: false
        });
      }

      try {
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
          subject: `New Pre-Order from ${name}`,
          html: `
            <h3>New Pre-Order Received</h3>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Items:</strong> ${escapeHtml(items)}</p>
            <p><strong>Date Needed:</strong> ${escapeHtml(dateNeeded)}</p>
            <p><strong>Message:</strong> ${escapeHtml(message || "None")}</p>
          `
        });
        return res.status(201).json({
          message: "Order received!",
          orderSaved: true,
          notificationSent: true
        });
      } catch (err) {
        console.error("Order saved, but notification email failed:", err);
        return res.status(201).json({
          message: "Order received, but bakery email notification failed.",
          orderSaved: true,
          notificationSent: false
        });
      }

    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // update order
  if (req.method === "PUT") {
    try {
      await connectDB();

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
