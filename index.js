const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const cors = require('cors')
const { errorHandler } = require("./utils/errorHandler");

dotenv.config();

const app = express();
 
connectDB();
   

app.use(cors());  

app.use(express.json());  
// app.use(express.static("Public"));
app.use("/image", express.static("Public/image"));
app.use("/api/users", userRoutes);
app.use("/api/admin", userRoutes);

app.get('/' , (req , res)=>{
    res.send("Hello") 
})

app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
