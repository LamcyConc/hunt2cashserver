const express = require("express")
const router = express.Router()
const { verifyUser } = require("../middleware/authMiddleware")
const { getExchangeDetails, topUpLiquidity, updateWalletAddresses} = require("../controllers/exchangeController")

router.get("/exchange-details", verifyUser, getExchangeDetails)
router.post("/topup", verifyUser, topUpLiquidity)
router.patch("/wallets", verifyUser, updateWalletAddresses)

module.exports = router;