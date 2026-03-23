const mongoose = require("mongoose")

const PinSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    pin: { type: String, required: true },
    isSet: { type: Boolean, default: false }

}, { timestamps: true })

const PinModel = mongoose.model("Pin", PinSchema)

module.exports = PinModel;