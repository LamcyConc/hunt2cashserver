const express = require("express")
const { verifyUser } = require("../middleware/authMiddleware")
const { setPin, changePin, resetPin } = require("../controllers/pinController")

const router = express.Router()


router.post("/setpin", verifyUser, setPin)
router.patch("/changepin", verifyUser, changePin)
router.patch("/reset", verifyUser, resetPin)

module.exports = router