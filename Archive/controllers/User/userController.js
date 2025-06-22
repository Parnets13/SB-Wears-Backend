const 
{  
  Title ,  
  OccProduct,
  categoryProduct,
  User,OccasionCategory,  

} = require("../../models/userModel");   

const {Admin } = require("../../models/adminModel")

const jwt = require("jsonwebtoken");
const HARD_CODED_OTP = "1234";
require("dotenv").config();
const multer = require("multer");
const { default: mongoose } = require("mongoose");
// const cors = require("cors");
// app.use(cors());
// app.use(express.json());

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// const reqOTP = async (req, res) => {
//   const { phoneNumber } = req.body;
//   if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

//   try {
//     let user = await User.findOne({ phoneNumber });

//     // If user doesn't exist, create a new one
//     if (!user) {
//       user = new User({ phoneNumber });
//     }

//     // Assign hardcoded OTP
//     user.otp = HARD_CODED_OTP;
//     user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes
//     await user.save();

//     res.status(200).json({ message: `OTP sent successfully`, otp: HARD_CODED_OTP }); // OTP visible for testing
//   } catch (error) {
//     console.error("Error in OTP request:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// } 
 
// const verifyOTP =  async (req, res) => {
//   const { phoneNumber, otp } = req.body;
//   if (!phoneNumber || !otp) return res.status(400).json({ error: "Phone number and OTP are required" });

//   try {
//     const user = await User.findOne({ phoneNumber });
//     if (!user) return res.status(400).json({ error: "User not found" });

//     // Check if OTP is correct
//     if (otp !== HARD_CODED_OTP) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     // Generate JWT Token
//     const token = jwt.sign({ userId: user._id, phoneNumber }, process.env.JWT_SECRET, { expiresIn: "7d" });

//     // Clear OTP after successful login
//     user.otp = '1234';
//     user.email = undefined,
//     user.otpExpires = Date.now();
//     await user.save();

//     res.status(200).json({ message: "Login successful", token, user });
//   } catch (error) {
//     console.error("Error in OTP verification:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// }

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates 4-digit OTP
};

const reqOTP = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

  try {
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = new User({ phoneNumber });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    
    // In production, you would send this OTP via SMS service like Twilio
    console.log(`OTP for ${phoneNumber}: ${otp}`); // Remove in production
    
    await user.save();

    res.status(200).json({ 
      message: "OTP sent successfully", 
      otp: otp // Remove this in production, only for testing
    });
  } catch (error) {
    console.error("Error in OTP request:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "Phone number and OTP are required" });
  }

  try {
    const user = await User.findOne({ 
      phoneNumber,
      otpExpires: { $gt: Date.now() } // Check if OTP is not expired
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid OTP or OTP expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Generate JWT Token (valid for 7 days)
    const token = jwt.sign(
      { userId: user._id, phoneNumber }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Instead of setting to undefined, set to empty/null values
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ 
      message: "Login successful", 
      token,
      user 
    });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try { 
      const {userId} = req.query; 
      const {updatedData} = req.body;  
      // console.log(userId , updatedData)

      const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

      return res.status(200).json({ message: "User details updated", user: updatedUser });
  } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
  }
}

const AdminDetails = async (req, res) => {
  try {
    const { email } = req.body; // Use query params for GET requests

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    return res.status(200).json({ message: "Admin details retrieved successfully", admin });

  } catch (error) {
    console.error("Error fetching admin details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// const getAllProductsFromAllOccasionCategories = async (req, res) => {
//   try {
//     // Find all products from CategoryProduct model
//     const products = await OccProduct.find();

//     // Check if any products are found
//     if (products.length === 0) {
//       return res.status(404).json({ message: 'No products found' });
//     }

//     return res.status(200).json({
//       message: 'All products fetched successfully',
//       products: products,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Error fetching all products' });
//   }
// };

const getAllProductsFromAllOccasionCategories = async (req, res) => {
  try {
    
    const products = await OccProduct.find()
    .populate({
      path: "occasionCategory", // 1️⃣ This must match the field in the OccProduct schema
      model: "OccasionCategory",     // 2️⃣ This must match the Mongoose model name
      populate: {               // 3️⃣ This populates the "Occasion" field inside "OccCategory"
        path: "Occasion",       // 4️⃣ This must match the field in OccCategory schema
        model: "Title",         // 5️⃣ This must match the Mongoose model name
        select: "title subtitle", // 6️⃣ Select only "title" and "subtitle" fields from the Title collection
      },
    })
      .lean(); // Convert Mongoose documents to plain objects for better performance

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }
    
    // console.log(products)
    return res.status(200).json({
      message: "All products fetched successfully",
      products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching all products" });
  }
};
 
const getAllProductsFromAllCategories = async (req, res) => {
  try {
    // Find all products from CategoryProduct model
    const products = await categoryProduct.find()

    return res.status(200).json({
      message: products.length > 0 ? "All products fetched successfully" : "No products available",
      products: products,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching all products" });
  }
};

const getProductByID = async (req, res) => {
  try {
    const id = req.params.id;

    // Make sure the ID exists and is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ error: "Invalid ObjectId" });
    }

    const product = await categoryProduct.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching product", message: error.message });
  }
};




const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await categoryProduct.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Product not found" });
    } 
    await categoryProduct.findByIdAndDelete(id); 
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting Product:", error);
    return res.status(500).json({ error: "Error deleting Product" });
  }
};

const getOccasionWithCategoriesAndProducts = async (req, res) => {
  try {
    const { occasionId } = req.params;

    // Fetch the Occasion with Categories & Products
    const occasion = await Title.findById(occasionId)
      .populate({
        path: "categories",
        populate: {
          path: "products",
          model: "OccasionProduct"
        }
      });

    if (!occasion) {
      return res.status(404).json({ message: "Occasion not found" });
    }

    res.status(200).json(occasion);

  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
};
 
const AddToCart = async (req , res)=> {
  const {userId, productId, size , quantity = 1} = req.body
  // console.log(userId, productId, size , productType)
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if product already exists in the cart
    const existingProduct = user.cart.find(
      (item) => item.productId.toString() === productId.toString() 
      && item.size === size
    );

    if (existingProduct) {
      // If product exists, update quantity
      existingProduct.quantity += quantity;
    } else {
      // If product does not exist, add it to the cart
      user.cart.push({
        productId,
        size,
        quantity,
        addedAt: Date.now(),
      });
    }

    await user.save();
    return res.status(200).json(user.cart); // Return updated cart
  } catch (error) {
    console.error( error.message);
    // throw new Error("Error adding product to cart");
  }
}
  
const RemoveFromCart = async (req, res) => {
  const { userId, productId, productType, size, removeAll = false } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the product in the cart
    const existingProductIndex = user.cart.findIndex(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.productType === productType && item.size === size
    );

    if (existingProductIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }
 
    if (removeAll) {
      // Remove the entire product from the cart
      user.cart.splice(existingProductIndex, 1);
    } else {
      // Reduce the quantity by 1
      if (user.cart[existingProductIndex].quantity > 1) {
        user.cart[existingProductIndex].quantity -= 1;
      } else {
        // If quantity becomes 0, remove the product
        user.cart.splice(existingProductIndex, 1);
      }
    }

    await user.save();
    return res.status(200).json(user.cart); // Return updated cart
  } catch (error) {
    console.error("Error removing from cart:", error);
    return res.status(500).json({ error: "Error removing product from cart" });
  }
};


module.exports = 
{ 
  reqOTP , verifyOTP, updateUser, AdminDetails,
  getAllProductsFromAllOccasionCategories,
  getOccasionWithCategoriesAndProducts , 
  getAllProductsFromAllCategories, 
  deleteProduct,
  AddToCart,RemoveFromCart,getProductByID
};








// const twilio = require("twilio"); 
// const crypto = require("crypto");  

// const generateOtp = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();  // 6-digit OTP
// };

// // Example function to send OTP via Twilio (you can replace this with your own method)
// const sendOtp = (phoneNumber, otp) => {
//   const client = twilio("your-twilio-account-sid", "your-twilio-auth-token");
  
//   client.messages
//     .create({
//       body: `Your OTP is: ${otp}`,
//       from: "your-twilio-phone-number",
//       to: phoneNumber,
//     })
//     .then(message => console.log("OTP sent:", message.sid))
//     .catch(err => console.error("Error sending OTP:", err));
// };

// // Signup function
// const signupUser = async (req, res) => {
//   const { phoneNumber } = req.body;

//   try {
//     // Check if user already exists
//     const existingUser = await User.findOne({ phoneNumber });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Generate OTP
//     const otp = generateOtp();
//     const otpExpires = Date.now() + 10 * 60 * 1000;  // OTP expires in 10 minutes

//     // Save user with OTP and expiration
//     const newUser = new User({
//       phoneNumber,
//       otp,
//       otpExpires,
//     });
//     await newUser.save();

//     // Send OTP via SMS
//     sendOtp(phoneNumber, otp);

//     res.status(200).json({ message: "OTP sent successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// }; 

// const getUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };