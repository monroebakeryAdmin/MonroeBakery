import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Order from "../models/Order.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, phone, items, dateNeeded, message } = req.body;

    if (!name || !email || !phone || !items || !dateNeeded) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // ---- CONNECT TO MONGO (Vercel-safe way) ----
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // ---- SAVE ORDER ----
    const newOrder = new Order({
      name,
      email,
      phone,
      items,
      dateNeeded,
      message
    });

    await newOrder.save();

    // ---- EMAIL TRANSPORTER ----
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.BUSINESS_EMAIL,
        pass: process.env.BUSINESS_PASS
      }
    });

    // ---- SEND EMAIL TO BAKERY ----
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

    // ---- SMS ALERT VIA EMAIL GATEWAY ----
    const smsRecipients = [
      "734XXXXXXX@vtext.com",
      "313XXXXXXX@tmomail.net",
      "248XXXXXXX@tmomail.net"
    ];

    transporter
      .sendMail({
        from: process.env.BUSINESS_EMAIL,
        to: smsRecipients,
        subject: "",
        text: `📦 New bakery order from ${name}! Check your bakery email.`
      })
      .catch(() => null);

    return res.status(200).json({ message: "Order received!" });

  } catch (error) {
    console.error("❌ API ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
