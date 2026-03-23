// models/exchangeModel.js
const mongoose = require("mongoose")

const ExchangeSchema = new mongoose.Schema({
    nairaLiquidity: {
        type: Number,
        default: 0
    },
    cryptoWallets: {
        btc: {
            type: String,
            default: "exchange-btc-wallet-address"
        },
        eth: {
            type: String,
            default: "exchange-eth-wallet-address"
        },
        usdt: {
            type: String,
            default: "exchange-usdt-wallet-address"
        }
    },
    totalBtcReceived: {
        type: Number,
        default: 0
    },
    totalEthReceived: {
        type: Number,
        default: 0
    },
    totalUsdtReceived: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const ExchangeModel = mongoose.model("Exchange", ExchangeSchema)

module.exports = ExchangeModel;