const express = require('express')
const app = express();
const ejs = require('ejs')
const cors = require("cors")
const dotenv = require('dotenv');
dotenv.config();

const corsOptions = {
    origin: [
        "https://hunt2cash.vercel.app",
        "http://localhost:5173", 
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200
};

app.set("view engine", 'ejs')
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors(corsOptions))


const { apiLimiter } = require('./middleware/rateLimiter');
app.use(apiLimiter)
const UserRouter = require('./routers/userRoutes');
app.use('/api/v1', UserRouter);
const AdminRouter = require('./routers/adminRoutes');
app.use('/api/v1/admin', AdminRouter);
const PINRouter = require('./routers/pinRoutes');
app.use('/api/v1', PINRouter);
const TransactionRouter = require('./routers/bankingRoutes');
app.use('/api/v1', TransactionRouter);
const CryptoRouter = require('./routers/cryptoRoutes');
app.use('/api/v1', CryptoRouter);
const ExchangeRouter = require("./routers/exchangeRoutes");
app.use("/api/v1/exchange", ExchangeRouter);

const { initializeExchange } = require("./controllers/exchangeController");
const connectDB = require('./config/connectDB');



if (process.env.NODE_ENV !== 'production') {
  app.listen(process.env.PORT || 5020, () => {
    console.log(`Server started successfully`);
  });
}

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    await initializeExchange();
    isConnected = true;
  }
  return app(req, res);
}