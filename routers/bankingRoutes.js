const express = require("express")

const { transferFunds, depositFunds, withdrawFunds, getTransactionHistory, findAccountName } = require("../controllers/bankingController")
const { verifyUser } = require("../middleware/authMiddleware")
const { verifyPin } = require("../controllers/pinController")
const router = express.Router()


router.post("/transfer", verifyUser, verifyPin, transferFunds)
router.post("/deposit", verifyUser, depositFunds)
router.post("/withdraw", verifyUser, verifyPin, withdrawFunds)
router.post("/history", verifyUser, getTransactionHistory)
router.post("/lookup", verifyUser, findAccountName)




module.exports = router;