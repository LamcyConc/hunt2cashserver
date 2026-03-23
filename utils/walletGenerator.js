const crypto = require('crypto');

const generateBTCAddress = async() => {
    const prefix = "bc1";
    try {
        const random = crypto.randomBytes(20).toString("hex");
        return prefix + random;
    } catch (error) {
        console.error("Failed to generate BTC address:", error);
        return null;
    }
};

const generateETHAddress = async() => {
    const prefix = "0x";
    try {
        const random = crypto.randomBytes(20).toString("hex");
        return prefix + random;
    } catch (error) {
        console.error("Failed to generate ETH address:", error);
        return null;
    }
};

const generateUSDTAddress = async () => {
    const prefix = "T";
    try {
        const random = crypto.randomBytes(25).toString("hex");
        return prefix + random;
    } catch (error) {
        console.error("Failed to generate USDT address:", error);
        return null;
    }
};

module.exports = {
    generateBTCAddress,
    generateETHAddress,
    generateUSDTAddress
};