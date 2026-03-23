const ExchangeModel = require("../models/exchangeModel")

// Initialize exchange — run once on server setup
const initializeExchange = async () => {
    try {
        const existing = await ExchangeModel.findOne()
        if (!existing) {
            await ExchangeModel.create({})
            console.log("Exchange initialized successfully")
        } else {
            console.log("Exchange is active, skipping initialization...")
        }
    } catch (error) {
        console.log("Exchange initialization error:", error.message)
    }
}

// Get exchange details (admin only)
const getExchangeDetails = async (req, res) => {
    try {
        const exchange = await ExchangeModel.findOne()

        if (!exchange) {
            return res.status(404).send({
                message: "Exchange not found"
            })
        }

        res.status(200).send({
            message: "Exchange details fetched successfully",
            data: exchange
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

const topUpLiquidity = async (req, res) => {
    const { amount } = req.body

    try {
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).send({
                message: "Valid amount is required"
            })
        }

        const exchange = await ExchangeModel.findOne()

        if (!exchange) {
            return res.status(404).send({
                message: "Exchange not found"
            })
        }

        exchange.nairaLiquidity += parseFloat(amount)
        await exchange.save()

        res.status(200).send({
            message: "Liquidity topped up successfully",
            data: {
                nairaLiquidity: exchange.nairaLiquidity
            }
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

// Update exchange crypto wallet addresses (admin only)
const updateWalletAddresses = async (req, res) => {
    const { btc, eth, usdt } = req.body

    try {
        const exchange = await ExchangeModel.findOne()

        if (!exchange) {
            return res.status(404).send({
                message: "Exchange not found"
            })
        }

        if (btc)  exchange.cryptoWallets.btc  = btc
        if (eth)  exchange.cryptoWallets.eth  = eth
        if (usdt) exchange.cryptoWallets.usdt = usdt

        await exchange.save()

        res.status(200).send({
            message: "Wallet addresses updated successfully",
            data: exchange.cryptoWallets
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

module.exports = {
    initializeExchange,
    getExchangeDetails,
    topUpLiquidity,
    updateWalletAddresses
}