const express = require('express');

const { getAlluser, toggleUserStatus, deleteUser, sendAdminMessage, getAdminMessage } = require("../controllers/adminController");
const { verifyUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.get('/allusers', verifyUser, getAlluser);
router.patch("/user/:id/toggle-status", verifyUser, toggleUserStatus);
router.delete('/deleteuser/:id', verifyUser, deleteUser);
router.post("/message", verifyUser, sendAdminMessage)
router.get("/message", verifyUser, getAdminMessage)


module.exports= router;