const jwt = require('jsonwebtoken');


const verifyUser = async (req, res, next) => {
    try {
        const token = req.headers["authorization"].split(" ")[1]
            ? req.headers["authorization"].split(" ")[1]
            : req.headers["authorization"].split(" ")[0];

            if (!token) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Session expired. Please login again."
                });
            }

        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);

        req.user = decoded;

        next();

    } catch (err) {
        res.status(401).send({
            message: "User Unauthorized"
        });
    }
};

module.exports = {
    verifyUser
}