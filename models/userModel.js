const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: String, enum: ['user', 'admin'], default: "user" },
  isActive: { type: Boolean, default: true },
  bankBalance: { type: Number, default: 100000 },
  accountNumber: { type: String, unique: true },
  cryptoWallet: {
    btc: {
      address: { type: String, default: "" },
      balance: { type: Number, default: 0.005 }
    },
    eth: {
      address: { type: String, default: "" },
      balance: { type: Number, default: 0.1 }
    },
    usdt: {
      address: { type: String, default: "" },
      balance: { type: Number, default: 500 }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { strict: "throw" });

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel