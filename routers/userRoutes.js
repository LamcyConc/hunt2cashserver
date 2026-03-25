const express = require('express');
const { createUser, login, myProfile, deleteAccount, logOut, requestOTP, forgotPassword, changePassword } = require('../controllers/userController');
const { verifyUser } = require('../middleware/authMiddleware');
const { authLimiter, apiLimiter, otpLimiter } = require('../middleware/rateLimiter');
const router = express.Router()




router.post('/register', authLimiter, createUser);
router.post('/login', authLimiter, login);
router.get('/account', verifyUser, myProfile);
router.delete('/deleteprofile/:id', verifyUser, deleteAccount);
router.post('/logout', logOut);
router.post('/request-otp',otpLimiter, requestOTP)
router.post('/forgot-password', forgotPassword)
router.post('/change-password', verifyUser, changePassword)

router.use(apiLimiter)



module.exports = router;
