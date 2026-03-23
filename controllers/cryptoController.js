const mongoose = require("mongoose")
const UserModel = require("../models/userModel")
const CryptoTransactionModel = require("../models/walletModel")
const { getCryptoPriceNGN, getCryptoPriceUSD, getCachedPrices, calculateNairaValue, calculateUSDValue } = require("../services/cryptoService")
const { generateReference } = require("./bankingController")
const ExchangeModel = require("../models/exchangeModel")



const getCryptoPrices = async (req, res) => {
    try {
        const prices = await getCachedPrices()

        res.status(200).json({
            success: true,
            prices: {
                btc: {
                    name: "Bitcoin",
                    symbol: "BTC",
                    nairaPrice: prices.btc.ngn,
                    usdPrice: prices.btc.usd,
                    formatted: `₦${prices.btc.ngn.toLocaleString()}`,
                },
                eth: {
                    name: "Ethereum",
                    symbol: "ETH",
                    nairaPrice: prices.eth.ngn,
                    usdPrice: prices.eth.usd,
                    formatted: `₦${prices.eth.ngn.toLocaleString()}`
                },
                usdt: {
                    name: "Tether",
                    symbol: "USDT",
                    nairaPrice: prices.usdt.ngn,
                    usdPrice: prices.usdt.usd,
                    formatted: `₦${prices.usdt.ngn.toLocaleString()}`
                },
                dollarToNGN: prices.dollarToNairaRate

            }
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Error fetching crypto prices",
            error: error.message
        })
    }
}


const depositCrypto = async (req, res) => {
    const { cryptoType, amount, fromAddress } = req.body

    if (!cryptoType || !amount) {
        return res.status(400).json({
            success: false,
            message: "Crypto type and amount are required"
        })
    }

    const validCryptoTypes = ["btc", "eth", "usdt"]
    if (!validCryptoTypes.includes(cryptoType.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: "Invalid crypto type. Use: btc, eth, or usdt"
        })
    }

    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid amount"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const user = await UserModel.findById(req.user.id).session(session)

        if (!user) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const reference = generateReference()
        const txHash = "0x" + require("crypto").randomBytes(32).toString("hex")
        const cryptoKey = cryptoType.toLowerCase()
        const userWalletAddress = user.cryptoWallet[cryptoKey].address

        user.cryptoWallet[cryptoKey].balance = parseFloat(user.cryptoWallet[cryptoKey].balance) + parseFloat(depositAmount)
        await user.save({ session })

        const cryptoTransaction = await CryptoTransactionModel.create([{
            userId: user._id,
            type: "deposit",
            cryptoType: cryptoKey,
            cryptoAmount: depositAmount,
            fromAddress: fromAddress || "External Wallet",
            toAddress: userWalletAddress,
            txHash,
            status: "completed",
            reference,
            description: `Deposited ${depositAmount} ${cryptoType.toUpperCase()}`
        }], { session })

        await session.commitTransaction()
        session.endSession()

        res.status(200).json({
            success: true,
            message: "Crypto deposit successful",
            data: {
                reference: cryptoTransaction[0].reference,
                txHash: cryptoTransaction[0].txHash,
                cryptoType: cryptoType.toUpperCase(),
                amount: depositAmount,
                balanceAfter: user.cryptoWallet[cryptoKey].balance,
                date: cryptoTransaction[0].createdAt
            }
        })

    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Deposit failed",
            error: error.message
        })
    }
}


const sellCrypto = async (req, res) => {
    const { cryptoType, amount } = req.body

    if (!cryptoType || !amount) {
        return res.status(400).json({
            success: false,
            message: "Crypto type and amount are required"
        })
    }

    const validCryptoTypes = ["btc", "eth", "usdt"]
    if (!validCryptoTypes.includes(cryptoType.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: "Invalid crypto type. Use: btc, eth, or usdt"
        })
    }

    const sellAmount = parseFloat(amount)
    if (isNaN(sellAmount) || sellAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid amount"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const user = await UserModel.findById(req.user.id).session(session)

        if (!user) {
            await session.abortTransaction()
            session.endSession()
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const cryptoKey = cryptoType.toLowerCase()


        if (user.cryptoWallet[cryptoKey].balance < sellAmount) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({
                success: false,
                message: `Insufficient ${cryptoType.toUpperCase()} balance`,
                available: user.cryptoWallet[cryptoKey].balance,
                required: sellAmount
            })
        }


        const exchangeRate = await getCryptoPriceNGN(cryptoKey)
        const nairaAmount = await calculateNairaValue(cryptoKey, sellAmount)
        const fee = nairaAmount * 0.01
        const netNairaAmount = nairaAmount - fee


        const exchange = await ExchangeModel.findOne().session(session)

        if (!exchange) {
            await session.abortTransaction()
            session.endSession()
            return res.status(500).json({
                success: false,
                message: "Exchange not available, please try again later"
            })
        }

        if (exchange.nairaLiquidity < netNairaAmount) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({
                success: false,
                message: "Exchange is currently unable to process this transaction, please try again later"
            })
        }

        const reference = generateReference()


        user.cryptoWallet[cryptoKey].balance -= sellAmount
        await user.save({ session })


        exchange.nairaLiquidity -= netNairaAmount


        if (cryptoKey === "btc") exchange.totalBtcReceived += sellAmount
        else if (cryptoKey === "eth") exchange.totalEthReceived += sellAmount
        else if (cryptoKey === "usdt") exchange.totalUsdtReceived += sellAmount

        await exchange.save({ session })


        user.bankBalance = parseFloat(user.bankBalance) + netNairaAmount
        await user.save({ session })


        const cryptoTransaction = await CryptoTransactionModel.create([{
            userId: user._id,
            type: "sell",
            cryptoType: cryptoKey,
            cryptoAmount: sellAmount,
            nairaAmount,
            exchangeRate,
            status: "completed",
            reference,
            fee,
            toAddress: exchange.cryptoWallets[cryptoKey],
            description: `Sold ${sellAmount} ${cryptoType.toUpperCase()} for ₦${netNairaAmount.toLocaleString()}`
        }], { session })

        await session.commitTransaction()
        session.endSession()

        res.status(200).json({
            success: true,
            message: "Your order has been filled",
            data: {
                reference: cryptoTransaction[0].reference,
                cryptoType: cryptoType.toUpperCase(),
                cryptoAmount: sellAmount,
                exchangeRate,
                nairaAmount,
                fee,
                netAmount: netNairaAmount,
                cryptoBalanceAfter: user.cryptoWallet[cryptoKey].balance,
                bankBalanceAfter: user.bankBalance,
                date: cryptoTransaction[0].createdAt
            }
        })

    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Sell failed",
            error: error.message
        })
    }
}


const getCryptoWallet = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id).select("cryptoWallet bankBalance")

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const prices = await getCachedPrices()

        const btcNgnValue = user.cryptoWallet.btc.balance * prices.btc.ngn
        const ethNgnValue = user.cryptoWallet.eth.balance * prices.eth.ngn
        const usdtNgnValue = user.cryptoWallet.usdt.balance * prices.usdt.ngn
        const totalNgnValue = btcNgnValue + ethNgnValue + usdtNgnValue

        const btcUsdValue = user.cryptoWallet.btc.balance * prices.btc.usd
        const ethUsdValue = user.cryptoWallet.eth.balance * prices.eth.usd
        const usdtUsdValue = user.cryptoWallet.usdt.balance * prices.usdt.usd
        const totalUsdValue = btcUsdValue + ethUsdValue + usdtUsdValue

        res.status(200).json({
            success: true,
            data: {
                bankBalance: user.bankBalance,
                cryptoWallet: {
                    btc: {
                        balance: user.cryptoWallet.btc.balance,
                        address: user.cryptoWallet.btc.address,
                        ngnValue: btcNgnValue,
                        usdValue: btcUsdValue,
                        currentNgnPrice: prices.btc.ngn,
                        currentUsdPrice: prices.btc.usd,
                    },
                    eth: {
                        balance: user.cryptoWallet.eth.balance,
                        address: user.cryptoWallet.eth.address,
                        ngnValue: ethNgnValue,
                        usdValue: ethUsdValue,
                        currentNgnPrice: prices.eth.ngn,
                        currentUsdPrice: prices.eth.usd,
                    },
                    usdt: {
                        balance: user.cryptoWallet.usdt.balance,
                        address: user.cryptoWallet.usdt.address,
                        ngnValue: usdtNgnValue,
                        usdValue: usdtUsdValue,
                        currentNgnPrice: prices.usdt.ngn,
                        currentUsdPrice: prices.usdt.usd,
                    }
                },
                totalNgnValue,
                totalUsdValue,
                totalPortfolioValue: parseFloat(user.bankBalance) + totalNgnValue
            }
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Error fetching wallet",
            error: error.message
        })
    }
}


const getCryptoTransactionHistory = async (req, res) => {
    try {
        const { type, cryptoType, limit = 10 } = req.query

        const filter = { userId: req.user.id }
        if (type) filter.type = type
        if (cryptoType) filter.cryptoType = cryptoType.toLowerCase()

        const transactions = await CryptoTransactionModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))

        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Error fetching transaction history",
            error: error.message
        })
    }
}


module.exports = {
    getCryptoPrices,
    depositCrypto,
    sellCrypto,
    getCryptoWallet,
    getCryptoTransactionHistory
}