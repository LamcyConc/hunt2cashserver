const bcrypt = require("bcrypt")
const PinModel = require("../models/pinModel")
const UserModel = require("../models/userModel")



const setPin = async (req, res) => {
    const { pin } = req.body

    try {
        // Check pin is exactly 4 digits
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).send({
                message: "PIN must be exactly 4 digits"
            })
        }

        // Check if user already has a PIN
        const existingPin = await PinModel.findOne({ user: req.user.id })
        if (existingPin && existingPin.isSet) {
            return res.status(400).send({
                message: "PIN already set, use change PIN instead"
            })
        }

        const saltround = await bcrypt.genSalt(10)
        const hashedPin = await bcrypt.hash(pin, saltround)

        await PinModel.create({
            user: req.user.id,
            pin: hashedPin,
            isSet: true
        })

        res.status(201).send({
            message: "PIN set successfully"
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

const changePin = async (req, res) => {
    const { currentPin, newPin } = req.body

    try {
        if (!/^\d{4}$/.test(newPin)) {
            return res.status(400).send({
                message: "New PIN must be exactly 4 digits"
            })
        }

        const userPin = await PinModel.findOne({ user: req.user.id })
        if (!userPin || !userPin.isSet) {
            return res.status(404).send({
                message: "PIN not set yet, please set a PIN first"
            })
        }

        const isMatch = await bcrypt.compare(currentPin, userPin.pin)
        if (!isMatch) {
            return res.status(400).send({
                message: "Old PIN is incorrect"
            })
        }

        const saltround = await bcrypt.genSalt(10)
        const hashedPin = await bcrypt.hash(newPin, saltround)

        userPin.pin = hashedPin
        await userPin.save()

        res.status(200).send({
            message: "PIN changed successfully"
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

const resetPin = async (req, res) => {
    const { password, newPin } = req.body

    try {
        if (!/^\d{4}$/.test(newPin)) {
            return res.status(400).send({
                message: "New PIN must be exactly 4 digits"
            })
        }

        const user = await UserModel.findById(req.user.id)
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).send({
                message: "Incorrect password"
            })
        }

        const saltround = await bcrypt.genSalt(10)
        const hashedPin = await bcrypt.hash(newPin, saltround)

        await PinModel.findOneAndUpdate(
            { user: req.user.id },
            { pin: hashedPin, isSet: true },
            { upsert: true, new: true }
        )

        res.status(200).send({
            message: "PIN reset successfully"
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}


const verifyPin = async (req, res, next) => {
    const { pin } = req.body

    try {
        if (!pin) {
            return res.status(400).send({
                message: "PIN is required"
            })
        }

        const userPin = await PinModel.findOne({ user: req.user.id })
        if (!userPin || !userPin.isSet) {
            return res.status(400).send({
                message: "PIN not set, please set a PIN first"
            })
        }

        const isMatch = await bcrypt.compare(pin, userPin.pin)
        if (!isMatch) {
            return res.status(400).send({
                message: "Incorrect PIN"
            })
        }

        next() 

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: "Something went wrong" })
    }
}

module.exports = { 
    setPin, 
    changePin, 
    resetPin, 
    verifyPin 
}