const express = require('express')
const app = express();
const ejs = require('ejs')
const mongoose = require("mongoose")
const cors = require("cors")
app.set("view engine", 'ejs')
const dotenv = require('dotenv');
dotenv.config();
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors())
const UserRouter = require('./routers/userRoutes');
app.use('/api/v1', UserRouter);
const AdminRouter = require('./routers/adminRoutes');
app.use('/api/v1/admin', AdminRouter);
const PINRouter = require('./routers/pinRoutes');
app.use('/api/v1', PINRouter);
const TransactionRouter = require('./routers/bankingRoutes');
app.use('/api/v1', TransactionRouter);
const CryptoRouter = require('./routers/cryptoRoutes');
const connectDB = require('./config/connectDB');
app.use('/api/v1', CryptoRouter);
const ExchangeRouter = require("./routers/exchangeRoutes");
app.use("/api/v1/exchange", ExchangeRouter);
const { initializeExchange } = require("./controllers/exchangeController");




// mongoose.connect(process.env.DATABASE_URI)
// .then(async()=>{
//   console.log("Database connected successfuly");
//   await initializeExchange();
// })
// .catch(()=>{
//   console.log("Failed to connect");
  
// });


app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log("Error starting server", err);
  } else {
    console.log(`Server started successfully`);
  }
});

module.exports=async(req, res)=>{
  await connectDB()
  await initializeExchange();
  return app (req, res)
}