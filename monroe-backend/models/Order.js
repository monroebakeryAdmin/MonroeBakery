import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  items: String,
  dateNeeded: String,
  message: String,
  status: { type: String, default: "Pending" }
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
