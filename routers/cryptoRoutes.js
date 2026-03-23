
const express = require("express");
const { getCryptoPrices, depositCrypto, sellCrypto, getCryptoWallet, getCryptoTransactionHistory} = require("../controllers/cryptoController");
const { verifyUser } = require("../middleware/authMiddleware");
const { verifyPin } = require("../controllers/pinController");

const router = express.Router();


router.get("/prices", getCryptoPrices);

router.get("/wallet", verifyUser, getCryptoWallet);
router.post("/depositcrypto", verifyUser, depositCrypto);
router.post("/sellcrypto", verifyUser, verifyPin, sellCrypto);
router.get("/cryptotransactions", verifyUser, getCryptoTransactionHistory);

module.exports = router;