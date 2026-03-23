const mongoose = require("mongoose")

const adminMessageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true
    },
    context: {
        type: String,
        enum: ["general", "sell", "deposit"],
        default: "general"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model("AdminMessage", adminMessageSchema)