const {
  Banner,
  User,
  OccasionCategory,
  ProCategory,
  ProSize,
  ProColor,
  ProFabric,
  ProTag,
  Title,
  OccProduct,
  categoryProduct,
} = require("../../models/userModel");

const { Admin } = require("../../models/adminModel");

const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id)
      .populate("cart.productId")
      .populate("wishlist.productId")
      .populate("recentlyViewed.productId");
      

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // Get the fields the user wants to update

    // Validate gender (only allow specified values)
    if (updates.gender && !["Male", "Female", "Other"].includes(updates.gender)) {
      return res.status(400).json({ error: "Invalid gender value" });
    }

    // Validate email format
    if (updates.email && !/^\S+@\S+\.\S+$/.test(updates.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Ensure there are fields to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    // Update only the provided fields
    updates.updatedAt = Date.now(); // Update timestamp

    const updatedUser = await User.findByIdAndUpdate(id, { $set: updates }, { 
      new: true, 
      runValidators: true 
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 }) // Sort by createdAt field (recent first)
      .exec();

    return res.status(200).json(users); // Return the list of users ordered by registration time
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Error fetching users");
  }
};

// const addBanner = async (req, res) => {
//   console.log("🚀 API Hit: addBanner function is being executed!");
//   // next();  // Let the request continue
//   console.log("Body Data:", req.body);  // Debugging request body
//   console.log("File Data:", req.file);  // Debugging uploaded file

//     const { imageLink, couponCode  } = req.body;
//     const image = req.file ? req.file.filename : null;

//     if (!image || !imageLink || !couponCode) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//   try {
//     const newBanner = new Banner({
//       image,
//       imageLink,
//       couponCode,
//     });

//     await newBanner.save();
//     return res
//       .status(201)
//       .json({ message: "Banner added successfully", banner: newBanner });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Error adding banner" });
//   }
// };

const addBanner = async (req, res) => {
  const { imageLink, couponCode } = req.body;
  const { bannerId } = req.query; // Extract bannerId from query params

  try {
    if (bannerId) {
      // 🛠 Update existing banner (partial update)
      const banner = await Banner.findById(bannerId);
      if (!banner) {
        return res.status(404).json({ error: "Banner not found" });
      }

      // Update only provided fields
      if (imageLink) banner.imageLink = imageLink;
      if (couponCode) banner.couponCode = couponCode;
      if (req.files && req.files.length > 0) {
        banner.image = req.files[0].filename; // Update image if provided
      }

      await banner.save();
      return res.status(200).json({ message: "Banner updated successfully", banner });
    } else {
      // 🔥 Add new banner (all fields required)
      if (!req.files || req.files.length === 0 || !imageLink || !couponCode) {
        return res.status(400).json({ error: "All fields are required for new banners" });
      }

      const newBanner = new Banner({
        image: req.files[0].filename,
        imageLink,
        couponCode,
      });

      await newBanner.save();
      return res.status(201).json({ message: "Banner added successfully", banner: newBanner });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Error processing banner request" });
  }
};

const deleteBanner = async (req, res) => {
  const { bannerId } = req.params; // Get bannerId from URL params

  try {
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ error: "Banner not found" });
    }

    // Remove the banner from the database
    await Banner.findByIdAndDelete(bannerId);

    return res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return res.status(500).json({ error: "Error deleting banner" });
  }
};


const getBanner = async (req, res) => {
  try {
    const banners = await Banner.find();

    const baseUrl = `${req.protocol}://${req.get("host")}/Public/image/`;
    const updatedBanners = banners.map((banner) => ({
      ...banner._doc,
      image: baseUrl + banner.image,
    }));

    // return res.status(200).json(updatedBanners);
    return res.status(200).json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return res.status(500).json({ error: "Error fetching banners" });
  }
};

const addOrUpdateTitle = async (req, res) => {
  const { titleId, title, subtitle, categories } = req.body;

  if (!titleId && (!title || !subtitle)) {
    return res.status(400).json({ error: "Title and Subtitle are required for new entries!" });
  }

  try {
    let validCategories = [];
    if (categories && categories.length > 0) {
      validCategories = await OccasionCategory.find({ _id: { $in: categories } });
      if (validCategories.length !== categories.length) {
        return res.status(400).json({ error: "One or more categories are invalid!" });
      }
    }

    if (titleId) {
      // ✅ **Update existing title**
      const updatedTitle = await Title.findByIdAndUpdate(
        titleId,
        {
          ...(title && { title }),  // Update only if provided
          ...(subtitle && { subtitle }),
          ...(categories && { categories: validCategories.map((cat) => cat._id) }),
        },
        { new: true, runValidators: true }
      );

      if (!updatedTitle) {
        return res.status(404).json({ error: "Title not found!" });
      }

      return res.status(200).json({
        message: "Title updated successfully!",
        title: updatedTitle,
      });
    } else {
      // ✅ **Create new title**
      const newTitle = new Title({
        title,
        subtitle,
        categories: validCategories.map((cat) => cat._id),
      });

      await newTitle.save();
      return res.status(201).json({
        message: "Title added successfully!",
        title: newTitle,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


const getTitle = async (req, res) => {
  try {
    const titles = await Title.find().populate("categories"); // Populating categories
    return res.status(200).json(titles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Titles" });
  }
};

const deleteTitle = async (req, res) => {
  const { titleId } = req.params; // Get bannerId from URL params

  try {
    const title = await Title.findById(titleId);
    if (!title) {
      return res.status(404).json({ error: "Title not found" });
    }

    // Remove the Title from the database
    await Banner.findByIdAndDelete(titleId);

    return res.status(200).json({ message: "Title deleted successfully" });
  } catch (error) {
    console.error("Error deleting title:", error);
    return res.status(500).json({ error: "Error deleting title" });
  }
};

const addOrUpdateOccCategory = async (req, res) => {
  const { Occasion, OccCategory, OccCategoryId } = req.body;

  if (!Occasion || !OccCategory) {
    return res.status(400).json({ error: "Occasion and Category are required!" });
  }

  try {
    // Check if Occasion (Title) exists
    const occasionExists = await Title.findById(Occasion);
    if (!occasionExists) {
      return res.status(404).json({ error: "Occasion (Title) not found!" });
    }

    if (OccCategoryId) {
      // ✅ **Update Existing Category**
      const updatedCategory = await OccasionCategory.findByIdAndUpdate(
        OccCategoryId,
        {
          // Occasion: occasionExists._id,
          OccCategory,
          ...(req.files.length > 0 && { image: req.files[0].filename }), // Update image only if a new file is uploaded
        },
        { new: true, runValidators: true }
      );

      if (!updatedCategory) {
        return res.status(404).json({ error: "Category not found!" });
      }

      return res.status(200).json({
        message: "Category updated successfully",
        category: updatedCategory, 
      });
    } else {
      // ✅ **Create New Category**
      const newCategory = new OccasionCategory({
        image: req.files[0]?.filename || null, // Save image only if provided
        Occasion: occasionExists._id,
        OccCategory,
      });

      await newCategory.save();

      // Add the new category reference to the associated Title document
      await Title.findByIdAndUpdate(Occasion, {
        $push: { categories: newCategory._id },
      });

      return res.status(201).json({
        message: "Category added successfully",
        category: newCategory,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error adding/updating Occasion Category" });
  }
};

const deleteOccCategory = async (req, res) => {
  const { OccCategoryId } = req.params;  

  try {
    const category = await OccasionCategory.findById(OccCategoryId);
    if (!category) {
      return res.status(404).json({ error: "Occasion Category not found" });
    }
 
    await OccasionCategory.findByIdAndDelete(OccCategoryId);

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting Category:", error);
    return res.status(500).json({ error: "Error deleting Category" });
  }
};

const addOccCategory = async (req, res) => {
  const { Occasion, OccCategory , OccCategoryId} = req.body;

  if (OccCategoryId){
    try{
      const occasionExists = await Title.findById(Occasion);
      if (!occasionExists) {
        return res.status(404).json({ error: "Occasion (Title) not found!" });
      }


      const updatedCategory = await OccasionCategory.findByIdAndUpdate(
        OccCategoryId,
        {
          Occasion: occasionExists._id,
          OccCategory,
          ...(req.files.length > 0 && { image: req.files[0].filename }), // Update image only if a new file is uploaded
        },
        { new: true, runValidators: true }
      );

      if (!updatedCategory) {
        return res.status(404).json({ error: "Category not found!" });
      }

      return res.status(200).json({
        message: "Category updated successfully",
        category: updatedCategory,
      });



    }catch(err){
      console.log(err)
      return res.status(500).json({ error: "Error adding Occasion Category" });
    }
  }

  if (req.files.length === 0 || !Occasion || !OccCategory) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // console.log(Occasion , OccCategory , "testing")
  try {
    // Check if Occasion (Title) exists
    const occasionExists = await Title.findById(Occasion);
    if (!occasionExists) {
      return res.status(404).json({ error: "Occasion (Title) not found!" });
    }
    // Create new Occasion Category with the correct reference
    const newCategory = new OccasionCategory({
      image: req.files[0].filename, // Save the image path in DB
      Occasion: occasionExists._id, // Explicitly setting the Occasion ID
      OccCategory,
    });

    // Save new category
    await newCategory.save();

    // Add the new category reference to the associated Title document
    await Title.findByIdAndUpdate(Occasion, {
      $push: { categories: newCategory._id },
    });

    return res.status(201).json({
      message: "Category added successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error adding Occasion Category" });
  }
}; 

const getOccCategory = async (req, res) => {
  try {
    const categories = await OccasionCategory.find()
      .populate("Occasion") // Populating the referenced Occasion (Title)
      .populate("products"); // Populating the referenced products

    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Categories" });
  }
};

const addProCategory = async (req, res) => {
  const { Category, Description } = req.body;

  // Validation to check if all required fields are provided
  if (req.files.length === 0 || !Category || !Description) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Create a new ProductCategory document
    const newProCategory = new ProCategory({
      image: req.files[0].filename,
      Category,
      Description,
    });

    // Save the ProductCategory to the database
    await newProCategory.save();

    return res.status(201).json({
      message: "Product Category added successfully",
      ProductCategory: newProCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error adding Product Category" });
  }
};

const addOrUpdateProCategory = async (req, res) => {
  const { CategoryId, Category, Description } = req.body;

  try {
    if (CategoryId) {
      // If CategoryId is provided, update the existing category
      const existingCategory = await ProCategory.findById(CategoryId);
      if (!existingCategory) {
        return res.status(404).json({ error: "Product Category not found" });
      }

      // Create an object to track changes
      const updateFields = {};
      let hasChanges = false;

      // Check and update each field if provided
      if (Category !== undefined) {
        updateFields.Category = Category;
        hasChanges = true;
      }
      if (Description !== undefined) {
        updateFields.Description = Description;
        hasChanges = true;
      }
      if (req.files?.length > 0) {
        updateFields.image = req.files[0].filename;
        hasChanges = true;
      }

      if (!hasChanges) {
        return res.status(400).json({ error: "No fields provided for update" });
      }

      // Update the category
      const updatedCategory = await ProCategory.findByIdAndUpdate(
        CategoryId,
        updateFields,
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        message: "Product Category updated successfully",
        ProductCategory: updatedCategory,
      });
    }
    else {
      // Validation for adding a new category
      if (req.files.length === 0 || !Category || !Description) {
        return res.status(400).json({ error: "All fields are required for adding a new category" });
      }

      // Create a new ProductCategory document
      const newProCategory = new ProCategory({
        image: req.files[0].filename,
        Category,
        Description,
      });

      await newProCategory.save();
      return res.status(201).json({
        message: "Product Category added successfully",
        ProductCategory: newProCategory,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error processing Product Category" });
  }
};

const getProCategory = async (req, res) => {
  try {
    const ProductCategories = await ProCategory.find().populate("products");
    return res.status(200).json(ProductCategories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Product Categories" });
  }
};

const getProCategoryById = async (req, res) => {
  console.log("req params : " , req.params.id)
  try {
    const ProductCategories = await ProCategory.findById(req.params.id)
    return res.status(200).json(ProductCategories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Product Category" });
  }
};

const deleteProCategory = async (req, res) => {
  const { ProCategoryId } = req.params;  

  try {
    const category = await ProCategory.findById(ProCategoryId);
    if (!category) {
      return res.status(404).json({ error: "Product Category not found" });
    }
 
    await ProCategory.findByIdAndDelete(ProCategoryId);

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting Category:", error);
    return res.status(500).json({ error: "Error deleting Category" });
  }
};

const addSize = async (req, res) => {
  const { Size } = req.body;
  try {
    const existingSize = await ProSize.findOne({ Size });

    if (existingSize) {
      return res.status(400).json({ error: "Size already exists" });
    }

    const newSize = new ProSize({ Size });
    await newSize.save();

    return res
      .status(201)
      .json({ message: "Product Size added successfully", newSize });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error adding Size" });
  }
};

const getSize = async (req, res) => {
  try {
    const AllSizes = await ProSize.find();
    return res.status(200).json(AllSizes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Product Sizes" });
  }
};

const addColor = async (req, res) => {
  const { Color } = req.body;
  try {
    const existingColor = await ProColor.findOne({ Color });

    if (existingColor) {
      return res.status(400).json({ error: "Color already exists" });
    }

    const newColor = new ProColor({ Color });
    await newColor.save();

    return res
      .status(201)
      .json({ message: "Product Color added successfully", newColor });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error adding Color" });
  }
};

const getColor = async (req, res) => {
  try {
    const AllColors = await ProColor.find();
    return res.status(200).json(AllColors);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Product Colors" });
  }
};

const addFabric = async (req, res) => {
  const { Fabric } = req.body;
  try {
    const existingFabric = await ProFabric.findOne({ Fabric });

    if (existingFabric) {
      return res.status(400).json({ error: "Fabric already exists" });
    }

    const newFabric = new ProFabric({ Fabric });
    await newFabric.save();

    return res
      .status(201)
      .json({ message: "Product Fabric added successfully", newFabric });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error adding Fabric" });
  }
};

const getFabric = async (req, res) => {
  try {
    const AllFabrics = await ProFabric.find();
    return res.status(200).json(AllFabrics);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Product Fabrics" });
  }
};

const addTag = async (req, res) => {
  const { Tag } = req.body;
  try {
    const existingTag = await ProTag.findOne({ Tag });

    if (existingTag) {
      return res.status(400).json({ error: "Tag already exists" });
    }

    const newTag = new ProTag({ Tag });
    await newTag.save();

    return res
      .status(201)
      .json({ message: "Product Tag added successfully", newTag });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error adding Tag" });
  }
};

const getTag = async (req, res) => {
  try {
    const AllTags = await ProTag.find();
    return res.status(200).json(AllTags);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching Product Tags" });
  }
};

// const addOrUpdateOccasionProduct = async (req, res) => {
//   try {
//     const { productId } = req.query;
//     // console.log(req.body , "body")
//     // console.log(req.files , "files")
//     const {name, mrp, discount, category, tag, color, fabric, size, description,
//        additionalInfo, status, stocks, sizeChart, occasionCategory,Minstocks,
//     } = req.body; 
//     // Validate required fields
//     if ( !name || !mrp || !category || !stocks || req.files.length === 0 ) {
//       // console.log(stocks);
//       return res.status(400).json({ message: "Missing required fields!" });
//     }

//     // Check if the Occasion Category exists
//     const categoryExists = await OccasionCategory.findById(occasionCategory);
//     if (!categoryExists) {
//       return res.status(404).json({ message: "Occasion Category not found!" });
//     }

//     // Calculate offer price if discount is provided
//     let offerPrice = mrp;
//     if (discount && discount > 0) {
//       offerPrice = mrp - mrp * (discount / 100);
//     }

//     if (productId) {
//       // Update existing product
//       const updatedProduct = await OccProduct.findByIdAndUpdate(
//         productId,
//         {name, mrp, discount: discount || 0, offerPrice, category, tag, color, fabric, size,
//            sizeChart, description, status,  additionalInfo,  stocks,  images,  occasionCategory,},
//         { new: true }
//       );

//       if (!updatedProduct) {
//         return res.status(404).json({ message: "Product not found!" });
//       }

//       return res.status(200).json({
//         message: "Product updated successfully!",
//         product: updatedProduct,
//       });
//     } else {
//       // Create new product
//       // console.log(sizeChart , images , req.files)
//       const newProduct = new OccProduct({
//         name,
//         mrp,
//         discount: discount || 0,
//         offerPrice,
//         category,
//         tag,
//         color : color.split(","), 
//         fabric,
//         size : size.split(","),
//         sizeChart : req.files[0].filename,
//         description,
//         status,
//         additionalInfo,
//         stocks, 
//         Minstocks,
//         images : [req.files[1].filename , req.files[2].filename , req.files[3].filename , req.files[4].filename],
//         occasionCategory,
//       });

//       const savedProduct = await newProduct.save();

//       // Add product reference to the category
//       await OccasionCategory.findByIdAndUpdate(occasionCategory, {
//         $push: { products: savedProduct._id },
//       });

//       return res.status(201).json({
//         message: "Product added successfully!",
//         product: savedProduct,
//       });
//     }
//   } catch (error) {
//     console.log(error)
//     res
//       .status(500)
//       .json({ message: "Error processing request", error: error.message });
//   }
// };

const addOrUpdateOccasionProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const {
      name, mrp, discount, category, tag, color, fabric, size, description,
      additionalInfo, status, stocks, occasionCategory, Minstocks
    } = req.body;

    // Validate required fields when adding a new product
    if (!productId && (!name || !mrp || !category || !stocks || req.files.length === 0)) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // Ensure occasion category exists
    const categoryExists = await OccasionCategory.findById(occasionCategory);
    if (!categoryExists) {
      return res.status(404).json({ message: "Occasion Category not found!" });
    }

    // Calculate offer price
    const offerPrice = discount && discount > 0 ? mrp - mrp * (discount / 100) : mrp;

    if (productId) {
      // **Update existing product**
      const existingProduct = await OccProduct.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found!" });
      }

      // Prepare updated fields
      const updatedFields = {
        ...(name && { name }),
        ...(mrp && { mrp }),
        ...(discount !== undefined && { discount }),
        ...(category && { category }),
        ...(tag && { tag }),
        ...(color && { color: color.split(",") }),
        ...(fabric && { fabric }),
        ...(size && { size: size.split(",") }),
        ...(description && { description }),
        ...(status && { status }),
        ...(additionalInfo && { additionalInfo }),
        ...(stocks && { stocks }),
        ...(Minstocks && { Minstocks }),
        ...(occasionCategory && { occasionCategory }),
        offerPrice
      };

      // Handle image updates
      if (req.files.length > 0) {
        updatedFields.sizeChart = req.files[0]?.filename || existingProduct.sizeChart;
        updatedFields.images = [
          req.files[1]?.filename || existingProduct.images[0],
          req.files[2]?.filename || existingProduct.images[1],
          req.files[3]?.filename || existingProduct.images[2],
          req.files[4]?.filename || existingProduct.images[3]
        ].filter(Boolean); // Remove undefined values
      }

      const updatedProduct = await OccProduct.findByIdAndUpdate(
        productId,
        updatedFields,
        { new: true }
      );

      return res.status(200).json({
        message: "Product updated successfully!",
        product: updatedProduct,
      });
    } else {
      // **Create a new product**
      const newProduct = new OccProduct({
        name,
        mrp,
        discount: discount || 0,
        offerPrice,
        category,
        tag,
        color: color.split(","),
        fabric,
        size: size.split(","),
        sizeChart: req.files[0].filename,
        description,
        status,
        additionalInfo,
        stocks,
        Minstocks,
        images: [
          req.files[1]?.filename,
          req.files[2]?.filename,
          req.files[3]?.filename,
          req.files[4]?.filename
        ].filter(Boolean), // Remove undefined values
        occasionCategory,
      });

      const savedProduct = await newProduct.save();

      // Add product reference to the category
      await OccasionCategory.findByIdAndUpdate(occasionCategory, {
        $push: { products: savedProduct._id },
      });

      return res.status(201).json({
        message: "Product added successfully!",
        product: savedProduct,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing request", error: error.message });
  }
};  
// const addOrUpdateProductInCategory = async (req, res) => {
//   const {
//     name,
//     mrp, 
//     discount, 
//     category, 
//     tag,
//     color,
//     fabric,
//     size,
//     status,
//     sizeChart,
//     description,
//     additionalInfo,
//     stocks,
//     Minstocks,
//     productCategoryId,
//   } = req.body;

//   let offerPrice = mrp;
//   if (discount && discount > 0) {
//     offerPrice = mrp - mrp * (discount / 100);
//   }
//   const { productId } = req.query;
//   try {
//     if (productId) {
//       // **UPDATE PRODUCT LOGIC**
//       const existingProduct = await categoryProduct.findById(productId);
//       if (!existingProduct) {
//         return res.status(404).json({ error: "Product not found" });
//       }

//       // Update the product with the new values (only provided fields will be updated)
//       const updatedProduct = await categoryProduct.findByIdAndUpdate(
//         productId,
//         {
//           name,
//           mrp,
//           discount,
//           offerPrice,
//           category,
//           images,
//           tag,
//           color,
//           status,
//           fabric,
//           size,
//           sizeChart,
//           description,
//           additionalInfo,
//           stocks,
//         },
//         { new: true } // Return updated product
//       );

//       return res.status(200).json({
//         message: "Product updated successfully",
//         Product: updatedProduct,
//       });
//     } else {
//       // **ADD NEW PRODUCT LOGIC**
//       if (
//         !name ||
//         !mrp ||
//         !category ||
//         req.files.length === 0 ||
//         !stocks ||
//         !productCategoryId
//       ) {
//         return res
//           .status(400)
//           .json({ error: "All required fields must be filled" });
//       }

//       const productCategory = await ProCategory.findById(productCategoryId);
//       if (!productCategory) {
//         return res.status(404).json({ error: "Product Category not found" });
//       }

//       const newProduct = new categoryProduct({
//         name,
//         mrp,
//         discount,
//         offerPrice,
//         category,
//         images : [req.files[1].filename , req.files[2].filename , req.files[3].filename , req.files[4].filename],
//         tag,
//         color : color.split(","),
//         status,
//         fabric,
//         size : size.split(","),
//         sizeChart : req.files[0].filename,
//         description,
//         Minstocks,
//         additionalInfo,
//         stocks,
//         productCategory: productCategoryId,
//       });

//       await newProduct.save();

//       productCategory.products.push(newProduct._id);
//       await productCategory.save();

//       return res.status(201).json({
//         message: "Product added successfully",
//         Product: newProduct,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Error processing product request" });
//   }
// };

const addOrUpdateProductInCategory = async (req, res) => {
  const {
    name,
    mrp,
    discount,
    category,
    tag,
    color,
    fabric,
    size,
    status,
    sizeChart,
    description,
    additionalInfo,
    stocks,
    Minstocks,
    productCategoryId,
  } = req.body;

  const { productId } = req.query;

  let offerPrice = mrp;
  if (discount && discount > 0) {
    offerPrice = mrp - mrp * (discount / 100);
  }
  
  try {
    const Booleanstatus = status === "active" ? true : false
    if (productId) {
      const existingProduct = await categoryProduct.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      const updatedFields = {};
      if (name !== undefined) updatedFields.name = name;
      if (mrp !== undefined) updatedFields.mrp = mrp;
      if (discount !== undefined) updatedFields.discount = discount;
      if (offerPrice !== undefined) updatedFields.offerPrice = offerPrice;
      if (category !== undefined) updatedFields.category = category;
      if (tag !== undefined) updatedFields.tag = tag;
      if (color !== undefined) updatedFields.color = color.split(",");
      if (fabric !== undefined) updatedFields.fabric = fabric;
      if (size !== undefined) updatedFields.size = size.split(",");
      if (status !== undefined) updatedFields.status = Booleanstatus
      if (description !== undefined) updatedFields.description = description;
      if (additionalInfo !== undefined) updatedFields.additionalInfo = additionalInfo;
      if (stocks !== undefined) updatedFields.stocks = stocks;
      if (Minstocks !== undefined) updatedFields.Minstocks = Minstocks;

      if (req.files && req.files.length > 0) {
        updatedFields.sizeChart = req.files[0]?.filename;
        updatedFields.images = req.files.slice(1).map((file) => file.filename);
      }

      const updatedProduct = await categoryProduct.findByIdAndUpdate(
        productId,
        updatedFields,
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        message: "Product updated successfully",
        Product: updatedProduct,
      });
    } else {
      if (!name || !mrp || !category || req.files.length < 1 || !stocks || !productCategoryId) {
      // if (!name || !mrp || !category || req.files.length < 4 || !productCategoryId) {
        return res.status(400).json({ error: "All required fields must be filled" });
      }

      const productCategory = await ProCategory.findById(productCategoryId);
      if (!productCategory) {
        return res.status(404).json({ error: "Product Category not found" });
      }

      const newProduct = new categoryProduct({
        name,
        mrp,
        discount,
        offerPrice,
        category,
        images: req.files.slice(1).map((file) => file.filename),
        tag,
        color: color.split(","),
        status : Booleanstatus,
        fabric,
        size: size.split(","),
        sizeChart: req.files[0].filename,
        description,
        Minstocks,
        additionalInfo,
        stocks,
        productCategory: productCategoryId,
      });

      await newProduct.save();
      productCategory.products.push(newProduct._id);
      await productCategory.save();

      return res.status(201).json({
        message: "Product added successfully",
        Product: newProduct,
      });
    }
  } catch (error) {
    console.error("Product creation/update error:", error);
    return res.status(500).json({ error: "Error processing product request" });
  }
};

const getCategoryProducts = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Find the category using the categoryId
    const productCategory = await ProCategory.findById(categoryId).populate(
      "products"
    );
    if (!productCategory) {
      return res.status(404).json({ error: "Product Category not found" });
    }

    // Return all the products associated with the category
    return res.status(200).json({
      message: "Products fetched successfully",
      products: productCategory.products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching category products" });
  }
};

const getOccCategoryProducts = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Find the category using the categoryId
    const productOccCategory = await OccasionCategory.findById(
      categoryId
    ).populate("products");
    if (!productOccCategory) {
      return res.status(404).json({ error: "Product Category not found" });
    }

    // Return all the products associated with the category
    return res.status(200).json({
      message: "Products fetched successfully",
      products: productOccCategory.products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching category products" });
  }
};

const updateOccasionStock = async (req, res) => {
  const { occasionCategory, productId, stockName, addedStock } = req.body;

  try {
    // Check if the Occasion Category exists
    const categoryExists = await OccasionCategory.findById(occasionCategory);
    if (!categoryExists) {
      return res.status(404).json({ message: "Occasion Category not found!" });
    }

    // Find the product by its ID
    if (productId) {
      // Update existing product
      const product = await OccProduct.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get the current stock before adding new stock
      const previousStock = product.stocks;

      // Update the total stock available
      product.stocks += parseInt(addedStock);

      // Add the stock history entry
      product.stockHistory.push({
        stockName,
        addedStock,
        previousStock, // Store the previous stock value
        addedAt: new Date(),
      });

      // Save the updated product
      await product.save();
      // Respond with the updated product data
      res.status(200).json({
        message: "Stock updated successfully",
        product,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating stock" });
  }
};

const updateCategoryStock = async (req, res) => {
  const { productCategoryId, productId, stockName, addedStock } = req.body;

  try {
    // Check if the Occasion Category exists
    const productCategory = await ProCategory.findById(productCategoryId);
    if (!productCategory) {
      return res.status(404).json({ error: "Product Category not found" });
    }

    // Find the product by its ID
    if (productId) {
      // Update existing product
      const product = await categoryProduct.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get the current stock before adding new stock
      const previousStock = product.stocks;

      // Update the total stock available
      product.stocks += parseInt(addedStock);

      // Add the stock history entry
      product.stockHistory.push({
        stockName,
        addedStock,
        previousStock, // Store the previous stock value
        addedAt: new Date(),
      });

      // Save the updated product
      await product.save();
      // Respond with the updated product data
      res.status(200).json({
        message: "Stock updated successfully",
        product,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating stock" });
  }
};

// const AbandonedCart = async (req, res) => {
//   const { userId } = req.body;
//   try {
//     // Find the user by ID
//     const user = await User.findById(userId);

//     if (!user) {
//       throw new Error("User not found");
//     }

//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     // Filter the cart items where addedAt is older than 7 days
//     const oldCartItems = user.cart.filter(
//       (item) => new Date(item.addedAt) < sevenDaysAgo
//     );

//     return res.status(200).json({ oldCartItems, user }); // Return the filtered cart items
//   } catch (error) {
//     console.error("Error fetching old cart items:", error);
//     throw new Error("Error fetching old cart items");
//   }
// };
const AbandonedCart = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all users along with their cart and populate product details
    const users = await User.find().populate("cart.productId");

    // Filter users who have abandoned cart items
    const usersWithAbandonedCarts = users
      .map((user) => {
        const oldCartItems = user.cart.filter(
          (item) => new Date(item.addedAt) < sevenDaysAgo
        );

        if (oldCartItems.length > 0) {
          return { ...user.toObject(), oldCartItems }; // Include full user data + oldCartItems
        }

        return null;
      })
      .filter(Boolean); // Remove null values

    return res.status(200).json({ usersWithAbandonedCarts }); // Return full user details with abandoned carts
  } catch (error) {
    console.error("Error fetching abandoned cart items:", error);
    return res.status(500).json({ message: "Error fetching abandoned cart items" });
  }
};


const AdminLogin = async (req, res) => {
  const { email, password } = req.body;

  // console.log("Admin login attempt:", email, password);

  try {
    // const existingAdmin = await Admin.findOne({ email: "admin@example.com" });

    // if (!existingAdmin) {
    //   const hashedPassword = await bcrypt.hash("Admin@123", 10);
    //   await Admin.create({
    //     email: "admin@example.com",
    //     password: hashedPassword,
    //   });
    //   console.log("✅ Admin created successfully!");
    // }
    // Hardcoded admin credentials
    const ADMIN_EMAIL = "admin@example.com";
    const ADMIN_PASSWORD = "Admin@123";

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generating jwt JWT token
    const token = jwt.sign({ role: "admin", email }, "your_secret_key", {
      expiresIn: "7d", // Token valid for 7 days
    });

    return res.status(200).json({ message: "Login successful", token, email });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//work on it
const AdminUpdate = async (req, res) => { 
  const { email } = req.query;   
  const updatedData = req.body;

  try {
    // Find the admin by email and update the details
    const updatedAdmin = await Admin.findOneAndUpdate(
      { email },
      { $set: updatedData },
      { new: true, runValidators: true } // Returns updated document & ensures validation
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    return res
      .status(200)
      .json({
        message: "Admin details updated successfully",
        admin: updatedAdmin,
      });
  } catch (error) {
    console.error("Error updating admin details:", error);
    console.log("Error updating admin details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  AdminLogin,
  AdminUpdate,
  getAllUsers,
  addBanner, deleteBanner,
  getBanner,
  addOrUpdateTitle,
  getTitle,
  deleteTitle,
  addOrUpdateOccCategory,
  addOccCategory,deleteOccCategory,
  getOccCategory,
  addProCategory,
  addOrUpdateProCategory,
  getProCategory,
  getProCategoryById,
  deleteProCategory,
  addSize,
  getSize,
  addColor,
  getColor,
  addFabric,
  getFabric,
  addTag,
  getTag,
  addOrUpdateOccasionProduct,
  addOrUpdateProductInCategory,
  updateOccasionStock,
  updateCategoryStock,
  AbandonedCart,
  getCategoryProducts,
  getOccCategoryProducts,
  getUser, updateUser 
};
 