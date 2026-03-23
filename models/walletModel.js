const mongoose = require("mongoose");

const CryptoTransactionSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["deposit", "sell"], required: true },
  cryptoType: { type: String, enum: ["btc", "eth", "usdt"], required: true },
  cryptoAmount: { type: Number, required: true },
  nairaAmount: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 0 },
  fromAddress: { type: String},
  toAddress: { type: String },
  txHash: { type: String },
  status: { type: String, 
    enum: ["pending", "completed", "failed"], 
    default: "pending" 
  },
  reference: { type: String, unique: true, required: true},
  description: { type: String },
  fee: { type: Number, default: 0 }
  
}, { timestamps: true });

const CryptoTransactionModel = mongoose.model("CryptoTransaction", CryptoTransactionSchema);

module.exports = CryptoTransactionModel;