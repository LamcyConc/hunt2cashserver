const mongoose = require("mongoose")

const TransactionSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: { 
        type: String, 
        enum: ["transfer", "deposit", "withdrawal"], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["success", "failed", "pending"], 
        default: "pending" 
    },
    description: { type: String },
    reference: { type: String, unique: true }

}, { timestamps: true })

const TransactionModel = mongoose.model("Transaction", TransactionSchema)

module.exports = TransactionModel;