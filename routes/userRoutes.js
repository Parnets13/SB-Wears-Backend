const express = require("express");
const router = express.Router();
const multer = require("multer");
const { 
    reqOTP , verifyOTP, updateUser,AdminDetails,
    getAllProductsFromAllOccasionCategories,
    getOccasionWithCategoriesAndProducts ,
    getAllProductsFromAllCategories, 
    AddToCart,
    RemoveFromCart,
    deleteProduct,
  } = require("../controllers/User/userController"); 

const { 
  
    getAllUsers , 
    addBanner , getBanner , 
    addTitle , getTitle , 
    addOccCategory , getOccCategory ,
    addProCategory , getProCategory ,
    addSize , getSize ,
    addColor , getColor ,
    addFabric , getFabric ,
    addTag , getTag ,
    addOrUpdateOccasionProduct ,   
    addOrUpdateProductInCategory  ,
    updateOccasionStock , updateCategoryStock , 
     AbandonedCart,
     AdminLogin, getCategoryProducts,
     AdminUpdate,
     getOccCategoryProducts,
     getUser,
     deleteBanner,
     addOrUpdateTitle,
     deleteTitle,
     addOrUpdateOccCategory,
     deleteOccCategory,
     deleteProCategory,
     addOrUpdateProCategory,
     getProCategoryById,
     updateStock,
     getProductStock,
     getStockHistory,
     getProductsWithStock
  }
   = require("../controllers/Admin/adminController"); 

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Public/image");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });


// router.get("/api/users", getUsers);
// router.post("/api/users", signupUser);

router.post("/banner", upload.any(),  addBanner);
router.get("/banner", getBanner);
router.delete("/banner/:bannerId", deleteBanner);

router.post("/occasion/title", addOrUpdateTitle);
router.get("/occasion/title", getTitle);
router.delete("/occasion/title/:titleId", deleteTitle);

router.post("/occasion/category", upload.any(), addOrUpdateOccCategory);
router.get("/occasion/category", getOccCategory);
router.delete("/occasion/category/:OccCategoryId", deleteOccCategory);

// router.post("/product/category", upload.any(), addOrUpdateProCategory);
// router.get("/product/category", getProCategory);
// router.get("/product/category/single/:id", getProCategoryById);
// router.delete("/product/category/:ProCategoryId", deleteProCategory);

// routes/category.js
router.post("/product/category", upload.any(), addOrUpdateProCategory);
router.post("/product/category/:id", upload.any(), addOrUpdateProCategory); // Update endpoint
router.get("/product/category", getProCategory);
router.get("/product/category/single/:id", getProCategoryById);
router.delete("/product/category/:ProCategoryId", deleteProCategory);

router.post("/productManagement/size", addSize);
router.get("/productManagement/size", getSize);

router.post("/productManagement/color", addColor);
router.get("/productManagement/color", getColor);

router.post("/productManagement/fabric", addFabric);
router.get("/productManagement/fabric", getFabric);

router.post("/productManagement/tag", addTag);
router.get("/productManagement/tag", getTag);

router.post("/occasion/product", upload.any(), addOrUpdateOccasionProduct);
router.get("/occasion/product", getAllProductsFromAllOccasionCategories);

router.post("/category/product", upload.any(), addOrUpdateProductInCategory); 
// router.put("/category/product/:productId", addOrUpdateProductInCategory); 
router.get("/category/product", getAllProductsFromAllCategories); 
router.delete("/category/product/:id", deleteProduct);

router.post("/update/occasion/stock" , updateOccasionStock)
router.post("/update/category/stock" , updateCategoryStock) 

// New Get products with stock information
router.get('/products/stock', getProductsWithStock);

// Get specific product stock
router.get('/products/:productId/stock', getProductStock);

// Update stock
router.post('/products/:productId/stock', updateStock);

// Get stock history
router.get('/products/:productId/stock-history', getStockHistory);

router.post("/auth/request-otp" , reqOTP)
router.post("/auth/verify-otp" , verifyOTP)
router.post("/user/update" , updateUser)

router.get("/user/:id" , getUser)
router.post("/update/user" , updateUser)
router.get("/getAllusers" , getAllUsers)

router.post("/cart/add" , AddToCart)
router.post("/cart/remove" , RemoveFromCart)
router.get("/cart/abandoned" , AbandonedCart)

router.post("/login", AdminLogin)
router.post("/update", AdminUpdate)
router.post("/details", AdminDetails)

// router.get("titles/category/:categoryId" , getCategoryProducts)
// router.get("/occasion/category/:categoryId" , getOccCategoryProducts)

router.get("/category/:categoryId" , getCategoryProducts)
router.get("/occasion/category/:categoryId" , getOccCategoryProducts)


module.exports = router; 