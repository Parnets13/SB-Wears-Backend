
const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
// });

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  imageLink: {
    type: String,
    required: true,
  },
  couponCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const titleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  }, 
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OccasionCategory", // Linking categories to an occasion title
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OccCategory = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  Occasion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Title", // Each category belongs to an occasion title
    required: true,
  },
  OccCategory: {
    type: String,
    required: true,
  }, 
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OccasionProduct", // Reference to OccasionProduct model
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OccasionProduct = new mongoose.Schema({
  name: { type: String, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  offerPrice: { type: Number },
  category: { type: String, required: true },
  sizeChart: { type: String},
  images: { type: [String], required: true }, // List of image URLs
  tag: { type: String },
  color: { type: [String] },  // Multiple colors
  fabric: { type: String },
  size: { type: [String] },   // Array of sizes
  description: { type: String },
  additionalInfo: { type: String },
  status: { type: Boolean, default: false }, 
  stocks: { type: Number, required: true, default: 0 },  
  Minstocks: { type: Number, required: true, default: 0 },  
  occasionCategory: { type: mongoose.Schema.Types.ObjectId, ref: "OccCategory" }, // Reference to Occasion
  stockHistory: [
    {
      stockName: { type: String, required: true },
      addedStock: { type: Number, required: true },
      previousStock: { type: Number, required: true }, // Previous stock before addition
      addedAt: { type: Date, default: Date.now } // Timestamp for when stock was added
    }
  ]
});

const ProductCategory = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  Category: {
    type: String,
    required: true,
  }, 
  Description: {
    type: String,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CategoryProduct", // Reference to CategoryProduct model
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CategoryProduct = new mongoose.Schema({
  name: { type: String, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  offerPrice: { type: Number },
  category: { type: String, required: true },
  sizeChart: { type: String},
  images: { type: [String], required: true }, 
  tag: { type: String },
  color: { type: [String] },  
  fabric: { type: String },
  size: { type: [String] },   
  description: { type: String },
  additionalInfo: { type: String },
  stocks: { type: Number, required: true, default: 0 }, 
  Minstocks: { type: Number, required: true, default: 0 }, 
  status: { type: Boolean, default: false }, 
  productCategory: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory" },  
  stockHistory: [
    {
      stockName: { type: String, required: true },
      addedStock: { type: Number, required: true },
      previousStock: { type: Number, required: true }, // Previous stock before addition
      addedAt: { type: Date, default: Date.now } // Timestamp for when stock was added
    }
  ]
});

const ProductSize = new mongoose.Schema({
  Size: {
    type: String,
    required: true,
  }, 
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProductColor = new mongoose.Schema({
  Color: {
    type: String,
    required: true,
  }, 
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProductFabric = new mongoose.Schema({
  Fabric: {
    type: String,
    required: true,
  }, 
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProductTag = new mongoose.Schema({
  Tag: {
    type: String,
    required: true,
  }, 
  createdAt: {
    type: Date,
    default: Date.now,
  }, 
});
  
const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true, 
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number'], // Optional: Regex to validate phone number format
  },
  otp: {
    type: String,
    required: true,  
  },
  otpExpires: {
    type: Date,
    required: true, 
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    // unique: true,
  },
  dob: {
    type: Date,
    required: false,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: false,
  },
  address: {
    type: String,
    required: false,
  },

  // Cart schema for storing both occasion and category products
  cart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'CategoryProduct',  // Dynamically reference either OccasionProduct or CategoryProduct
      },
    
      quantity: {
        type: Number,
        // required: true,
        default: 1,
      },
      size: {
        type: String,
        required: true 
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Wishlist supporting both product types
  wishlist: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'wishlist.productType',
      },
      productType: {
        type: String,
        required: true,
        enum: ['OccasionProduct', 'CategoryProduct'],
      },
    },
  ],

  // Recently viewed items
  recentlyViewed: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'recentlyViewed.productType',
      },
      productType: {
        type: String,
        required: true,
        enum: ['OccasionProduct', 'CategoryProduct'],
      },
    },
  ],

  // Order history
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  ],

  // Shipping details for checkout
  shippingDetails: {
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    addressL1: {
      type: String,
      required: false,
    },
    addressL2: {
      type: String,
      required: false,
    },
    company: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String, 
      match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number'], // Optional: Regex to validate phone number format
    },
    city: {
      type: String,
      required: false,
    },
    postalCode: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [
    { 
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'orderItems.productType',
      },
      productType: {
        type: String,
        required: true,
        enum: ['OccasionProduct', 'CategoryProduct'],
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingDetails: {
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  }, 
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// console.log("Registered Models:", mongoose.modelNames());

const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);
const Banner = mongoose.model('Banner', bannerSchema);
const Title = mongoose.model('Title', titleSchema);
const OccasionCategory = mongoose.model('OccasionCategory', OccCategory);
const OccProduct = mongoose.model('OccasionProduct', OccasionProduct);
const ProCategory = mongoose.model('ProductCategory', ProductCategory);
const categoryProduct = mongoose.model('CategoryProduct', CategoryProduct);
const ProSize = mongoose.model('ProductSize', ProductSize);
const ProColor = mongoose.model('ProductColor', ProductColor);
const ProFabric = mongoose.model('ProductFabric', ProductFabric);
const ProTag = mongoose.model('ProductTag', ProductTag); 

module.exports = {
  User , Order , Banner , 
  Title , OccasionCategory , 
  ProCategory , ProSize , 
  ProColor , ProFabric , 
  ProTag, OccProduct ,
  categoryProduct , 
}
 
