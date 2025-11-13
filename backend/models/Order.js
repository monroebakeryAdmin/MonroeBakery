import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  items: { type: String, required: true },
  dateNeeded: { type: String, required: true },
  message: { type: String },
  status: { type: String, default: "Pending" } // Pending | Approved | Rejected
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
