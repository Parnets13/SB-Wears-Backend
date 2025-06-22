const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  socialMedia: {
    instagram: { type: String, required: false },
    facebook: { type: String, required: false },
    twitter: { type: String, required: false },
    linkedin: { type: String, required: false },
    youtube: { type: String, required: false },
  },
}, { timestamps: true });

const Admin = mongoose.model("Admin", adminSchema);

module.exports = {
    Admin , 
    
};