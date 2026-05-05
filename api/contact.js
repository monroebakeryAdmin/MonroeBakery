import { connectDB } from "./db.js";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    try {
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ message: "Missing required fields." });
      }

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
        subject: `Contact from ${name}`,
        html: `
          <h3>Contact Message</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
        `
      });

      return res.status(201).json({ message: "Message sent!" });

    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}