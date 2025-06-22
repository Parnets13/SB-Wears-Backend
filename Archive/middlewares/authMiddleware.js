const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; 
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check if OTP has expired
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is correct, proceed with user creation
    // For example, you can save the user with additional fields like name, etc.
    user.otp = undefined; // Clear OTP after successful verification
    user.otpExpires = undefined; // Clear OTP expiration time
    await user.save();

    res.status(200).json({ message: "User signed up successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = verifyOtp;

module.exports = protect;