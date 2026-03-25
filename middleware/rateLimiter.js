const rateLimit = require("express-rate-limit")


const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { message: "Too many requests, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
})


const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { message: "Too many login attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
})

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3,
    message: { message: "Too many OTP requests, please try again after 10 minutes" },
    standardHeaders: true,
    legacyHeaders: false
})

module.exports= {
    apiLimiter,
    authLimiter,
    otpLimiter
}