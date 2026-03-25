const mongoose = require("mongoose")
const UserModel = require("../models/userModel")
const TransactionModel = require("../models/transactionModel")
const mailSender = require("../middleware/MailService/Mailer")
let nodemailer = require('nodemailer');




let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODE_MAIL,
        pass: process.env.NODE_PASS,
    }
});



const generateReference = () => {
    const date = new Date()
    const dateRef = date.getFullYear().toString() + date.getMonth().toString() + date.getDay().toString();
    const random = Math.floor(1000 + Math.random() * 9000)
    return `TRF-${dateRef}${random}`
}

const transferFunds = async (req, res) => {
    const { recipientAccountNumber, amount, description } = req.body

    // Start a session
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const sender = await UserModel.findById(req.user.id).session(session)
        if (!sender) {
            await session.abortTransaction()
            return res.status(404).send({ message: "Sender not found" })
        }

        // if (!sender.isActive) {
        //     await session.abortTransaction()
        //     return res.status(403).send({ message: "You cannot transfer to a suspended account" })
        // }

        if (String(sender.accountNumber) === String(recipientAccountNumber)) {
            await session.abortTransaction()
            return res.status(400).send({ message: "You cannot transfer money to yourself" })
        }

        const recipient = await UserModel.findOne({ accountNumber: recipientAccountNumber }).session(session)
        if (!recipient) {
            await session.abortTransaction()
            return res.status(404).send({ message: "Recipient account not found" })
        }

        if (amount <= 0) {
            await session.abortTransaction()
            return res.status(400).send({ message: "Invalid amount" })
        }

        if (sender.bankBalance < amount) {
            await session.abortTransaction()
            return res.status(400).send({ message: "Insufficient balance" })
        }

        sender.bankBalance = parseFloat(sender.bankBalance) - parseFloat(amount);
        await sender.save({ session })

        recipient.bankBalance = parseFloat(recipient.bankBalance) + parseFloat(amount);
        await recipient.save({ session })


        const reference = generateReference();

        const transaction = await TransactionModel.create([{
            sender: sender._id,
            recipient: recipient._id,
            amount,
            type: "transfer",
            status: "success",
            description: description || "Fund Transfer",
            reference
        }], { session })

        await session.commitTransaction()
        const debitMailContent = await mailSender('debitMail.ejs', {
            firstName: sender.firstName, recipientName: `${recipient.firstName} ${recipient.lastName}`, recipientAccount: recipient.accountNumber,
            reference: transaction[0].reference, description: transaction[0].description, amount, newBalance: sender.bankBalance
        })

        const creditMailContent = await mailSender('creditMail.ejs', {
            firstName: recipient.firstName, senderName: `${sender.firstName} ${sender.lastName}`,
            reference: transaction[0].reference, description: transaction[0].description, amount, newBalance: recipient.bankBalance
        })


        let debitOption = {
            from: `Hunt2Cash <${process.env.NODE_MAIL}>`,
            to: sender.email,
            subject: `DEBIT ALERT - Transaction Notification`,
            html: debitMailContent,
        };

        let creditOption = {
            from: `Hunt2Cash <${process.env.NODE_MAIL}>`,
            to: recipient.email,
            subject: `CREDIT ALERT - Transaction Notification`,
            html: creditMailContent,
        };


        try {
            await transporter.sendMail(debitOption);
            console.log("Debit alert sent to:", sender.email);
            await transporter.sendMail(creditOption);
            console.log("Credit alert sent to:", recipient.email);
        } catch (mailError) {
            console.error("Error sending alert emails:", mailError.message);
        }


        res.status(200).send({
            message: "Transfer successful",
            data: {
                reference: transaction[0].reference,
                amount,
                recipient: {
                    firstName: recipient.firstName,
                    lastName: recipient.lastName,
                    accountNumber: recipient.accountNumber
                },
                balanceAfter: sender.bankBalance,
                description: transaction[0].description,
                date: transaction[0].createdAt
            }
        })


    } catch (error) {
        await session.abortTransaction()
        console.log(error.message)
        res.status(500).send({ message: "Transfer failed, something went wrong" })

    } finally {
        session.endSession()
    }
};


const depositFunds = async (req, res) => {
    const { amount, description } = req.body

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const user = await UserModel.findById(req.user.id).session(session)
        if (!user) {
            await session.abortTransaction()
            return res.status(404).send({ message: "User not found" })
        }

        // if (!user.isActive) {
        //     await session.abortTransaction()
        //     return res.status(403).send({ message: "Your account is suspended" })
        // }

        if (amount <= 0) {
            await session.abortTransaction()
            return res.status(400).send({ message: "Invalid amount" })
        }

        const reference = generateReference()

        user.bankBalance = parseFloat(user.bankBalance) + parseFloat(amount);
        await user.save({ session })

        // Record the transaction
        const transaction = await TransactionModel.create([{
            sender: user._id,
            recipient: user._id,
            amount,
            type: "deposit",
            status: "success",
            description: description || "Deposit",
            reference
        }], { session })

        await session.commitTransaction()

        res.status(200).send({
            message: "Deposit successful",
            data: {
                reference: transaction[0].reference,
                amount,
                balanceAfter: user.bankBalance,
                description: transaction[0].description,
                date: transaction[0].createdAt
            }
        })

    } catch (error) {
        await session.abortTransaction()
        console.log(error)
        res.status(500).send({ message: "Deposit failed, something went wrong" })

    } finally {
        session.endSession()
    }
};


const withdrawFunds = async (req, res) => {
    const { amount, description } = req.body

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const user = await UserModel.findById(req.user.id).session(session)
        if (!user) {
            await session.abortTransaction()
            return res.status(404).send({ message: "User not found" })
        }

        // if (!user.isActive) {
        //     await session.abortTransaction()
        //     return res.status(403).send({ message: "Account is suspended, you cannot send money to this account" })
        // }

        if (amount <= 0) {
            await session.abortTransaction()
            return res.status(400).send({ message: "Invalid amount" })
        }

        if (user.bankBalance < amount) {
            await session.abortTransaction()
            return res.status(400).send({ message: "Insufficient balance" })
        }

        const reference = generateReference()

        user.bankBalance = parseFloat(user.bankBalance) - parseFloat(amount);
        await user.save({ session })

        const transaction = await TransactionModel.create([{
            sender: user._id,
            recipient: user._id,
            amount,
            type: "withdrawal",
            status: "success",
            description: description || "Withdrawal",
            reference
        }], { session })

        await session.commitTransaction()

        res.status(200).send({
            message: "Withdrawal successful",
            data: {
                reference: transaction[0].reference,
                amount,
                balanceAfter: user.bankBalance,
                description: transaction[0].description,
                date: transaction[0].createdAt
            }
        })

    } catch (error) {
        await session.abortTransaction()
        console.log(error)
        res.status(500).send({ message: "Withdrawal failed, something went wrong" })

    } finally {
        session.endSession()
    }
};

const getTransactionHistory = async (req, res) => {
    try {
        const transactions = await TransactionModel.find({
            $or: [
                { sender: req.user.id },
                { recipient: req.user.id }
            ]
        })
            .populate("sender", "firstName lastName accountNumber")
            .populate("recipient", "firstName lastName accountNumber")
            .sort({ createdAt: -1 })

        res.status(200).send({
            message: "Transactions retrieved successfully",
            data: transactions
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

const findAccountName = async (req, res) => {
    const { accountNumber } = req.body

    try {
        const user = await UserModel.findOne({ accountNumber }).select("firstName lastName accountNumber isActive")

        if (!user) {
            return res.status(404).send({
                message: "Account not found"
            })
        }

        if (!user.isActive) {
            return res.status(403).send({
                message: "Account is suspended"
            })
        }

        res.status(200).send({
            message: "Account found",
            data: {
                accountName: `${user.firstName} ${user.lastName}`,
                accountNumber: user.accountNumber
            }
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}



module.exports = {
    transferFunds,
    depositFunds,
    withdrawFunds,
    getTransactionHistory,
    findAccountName,
    generateReference
}