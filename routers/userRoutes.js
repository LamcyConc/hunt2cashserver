const express = require('express');
const { createUser, login, myProfile, deleteAccount, logOut, requestOTP, forgotPassword, changePassword } = require('../controllers/userController');
const { verifyUser } = require('../middleware/authMiddleware');
const router = express.Router()




router.post('/register', createUser);
router.post('/login', login);
router.get('/account', verifyUser, myProfile);
router.delete('/deleteprofile/:id', verifyUser, deleteAccount);
router.post('/logout', logOut);
router.post('/request-otp', requestOTP)
router.post('/forgot-password', forgotPassword)
router.post('/change-password', verifyUser, changePassword)




module.exports = router;
