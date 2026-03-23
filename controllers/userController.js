const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateBTCAddress, generateETHAddress, generateUSDTAddress } = require("../utils/walletGenerator");
let nodemailer = require('nodemailer');
const mailSender = require("../middleware/MailService/Mailer");
const BlacklistModel = require("../models/tokenBlacklist");
const otpgen = require("otp-generator");
const OTPModel = require("../models/otpModel");


let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODE_MAIL,
    pass: process.env.NODE_PASS,
  }
});

const generateAccountNumber = async () => {
    let accountNumber;
    let exists = true;

    const bankCode = "447";

    while (exists) {
        randomNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
        accountNumber = bankCode + randomNumber;
        exists = await UserModel.findOne({ accountNumber });
    }

    return accountNumber;
};

const createUser = async (req, res) => {
    const { lastName, email, password, firstName } = req.body

    try {
        const saltround = await bcrypt.genSalt(10)
        const harshedPassword = await bcrypt.hash(password, saltround);
        const accountNumber = await generateAccountNumber();
        const btcAddress = await generateBTCAddress();
        const ethAddress = await generateETHAddress();
        const usdtAddress = await generateUSDTAddress();


        const user = await UserModel.create({
            firstName,
            lastName,
            email,
            password: harshedPassword,
            accountNumber,
            bankBalance: 100000,
            cryptoWallet: {
                btc: { address: btcAddress },
                eth: { address: ethAddress },
                usdt: { address: usdtAddress },
            },
        });

        const renderMail = await mailSender("welcomeMail.ejs", {firstName, user})

        const token = jwt.sign({ id: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: "5h" });

        res.status(201).send({
            message: `🎉 Welcome aboard! Your account has been created successfully.\n\n🏦 Bank Bonus: You've been credited ₦${user.bankBalance.toLocaleString()} as your welcome bonus. \n\n💰 Crypto Bonus:\n   ₿ ${user.cryptoWallet.btc.balance} BTC \n   Ξ ${user.cryptoWallet.eth.balance} ETH\n   💵 ${user.cryptoWallet.usdt.balance} USDT \n\n Use your crypto balance to explore our seamless Crypto-to-Naira conversion feature. Enjoy! 🚀`,
                data: {
                lastName,
                firstName,
                email,
                accountNumber: user.accountNumber,
                bankBalance: user.bankBalance,
                cryptoBalances:{
                    BTC: user.cryptoWallet.btc.balance,
                    ETH: user.cryptoWallet.eth.balance,
                    USDT: user.cryptoWallet.usdt.balance,
                }
            },
            token
        });
                let mailOptions = {
                from: process.env.NODE_MAIL,
                bcc:email,
                subject: `Welcome onboard!, ${firstName}`,
                html: renderMail
            }

            try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
    } catch (mailError) {
      console.error("Error sending OTP email:", mailError);
    }

    } catch (error) {
        console.log(error.message);

        if (error.code == 11000) {
            return res.status(400).send({
                message: "This email has already been used to register an account"
            })
        }

        res.status(400).send({
            message: "User creation failed"
        })
    }
};

const login = async (req, res) => {
    const { email, password } = req.body

    try {
        const isUser = await UserModel.findOne({ email })
        if (!isUser) {
            return res.status(404).send({
                message: "Invalid Credentials"
            })
        }

        const isMatch = await bcrypt.compare(password, isUser.password)
        if (!isMatch) {
            return res.status(404).send({
                message: "Invalid Credentials"
            })
        }
        if (!isUser.isActive) {
            return res.status(403).send({
                message: "Account suspended, please contact support on"
            })
        }
        const token = jwt.sign({ id: isUser._id, roles: isUser.roles }, process.env.JWT_SECRET, { expiresIn: "5h" })

        res.status(200).send({
            message: "User logged in successfully",
            data: {
                email: isUser.email,
                roles: isUser.roles,
                firstName: isUser.firstName,
                lastName: isUser.lastName,
                accountNumber: isUser.accountNumber,
                bankBalance: isUser.bankBalance,
                cryptoBalances:{
                    BTC: isUser.cryptoWallet.btc.balance,
                    ETH: isUser.cryptoWallet.eth.balance,
                    USDT: isUser.cryptoWallet.usdt.balance,
                }
            },
            token
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send({
            message: "Something went wrong"
        })
    };
}

const myProfile = async (req, res) => {
    // const {id} = req.user

    try {
        const user = await UserModel.findById(req.user.id).select("-password")
        res.status(200).send({
            message: "User retrieved successfully",
            data: user
        })
    } catch (error) {
        console.log(error);

        res.status(404).send({
            message: "User not found"
        })
    }

};



const deleteAccount =async(req, res)=>{
        console.log(req.params);
    const {id} = req.params
    try {
        let user = await UserModel.findByIdAndDelete(id)
        
        if (!user){
            return res.status(404).send({
                message:"Account not found"
            })
        }
        res.status(200).send({
            message:"Account deleted successfully",
            data:{
                firstName: user.firstName,
                lastName: user.lastName,
            }
        })
    
    } catch (error) {
        console.log(error.message);
        res.status(400).send({
            message: "User deletion failed"
        })
        
    }
};



const logOut = async (req, res) => {
    try {

        const token = req.headers["authorization"].split(" ")[1]
            ? req.headers["authorization"].split(" ")[1]
            : req.headers["authorization"].split(" ")[0];

        await BlacklistModel.create({ token })

        res.status(200).send({
            message: "User logged out successfully"
        })
    } catch (error) {
        res.status(500).send({ message: "Something went wrong" })
    }
}

const requestOTP = async (req, res) => {
    const { email } = req.body
    try {

        const isUser = await UserModel.findOne({ email })

        if (!isUser) {
            res.status(404).send({
                message: "User not found"
            })
        }

        const sendOTP = otpgen.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, digits: true })
        
        await OTPModel.create({ email, otp: sendOTP })

        const otpMailContent = await mailSender('otpMail.ejs', {firstName: isUser.firstName, otp: sendOTP })

        res.status(200).send({
            message: "Otp sent successfully",
        });

        let mailOptions = {
            from: process.env.NODE_MAIL,
            // bcc: [email, "carawoodens@gmail.com"],
            to: isUser.email,
            subject: `OTP CODE`,
            html: otpMailContent,
        };

        try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
    } catch (mailError) {
      console.error("Error sending OTP email:", mailError);
    }

    } catch (error) {
        console.log(error);
        res.status(400).send({
            message: "Otp request failed",
        })

    }
}

const forgotPassword = async (req, res) => {
    const { otp, email, newPassword } = req.body
    try {
        const isUser = await OTPModel.findOne({ email })
        if (!isUser) {
            res.status(404).send({
                messgae: "Invalid OTP"
            })
            return;
        }

        let isMatch = otp == isUser.otp;
        if (!isMatch) {
            res.status(404).send({
                messgae: "Invalid OTP"
            })
            return;
        }

        const saltround = await bcrypt.genSalt(10)
        const harshedPassword = await bcrypt.hash(newPassword, saltround)
        const user = await UserModel.findOneAndUpdate({ email }, { password: harshedPassword }, { returnDocument: "after" })



        const passwordMailContent = await mailSender('passwordMail.ejs', {firstName: isUser.firstName, email })

        res.status(200).send({
            massage: "Password updated successfully"
        });

        let mailOptions = {
            from: process.env.NODE_MAIL,
            // bcc: [email, "carawoodens@gmail.com"],
            to: isUser.email,
            subject: `OTP CODE`,
            html: passwordMailContent,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        })

    } catch (error) {

    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body

    try {

        const isUser = await UserModel.findById(req.user.id)

        if (!isUser) {
            res.status(404).send({
                message: "Invalid User",
            });

            return
        }

        const isMatch = await bcrypt.compare(oldPassword, isUser.password)

        if (!isMatch) {
            res.status(404).send({
                message: "Wrong password!",
            });

            return
        }

        const saltRound = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(newPassword, saltRound);

        const user = await UserModel.findByIdAndUpdate({ _id: req.user.id }, { password: hashedPassword }, { new: true })

        res.status(200).send({
            message: "Password changed successfully"
        })
    } catch (error) {
        console.log(error);

        res.status(404).send({
            message: "Failed to change password",
        });
    }
};


module.exports = {
    createUser,
    login,
    myProfile,
    deleteAccount,
    logOut,
    requestOTP,
    forgotPassword,
    changePassword
}