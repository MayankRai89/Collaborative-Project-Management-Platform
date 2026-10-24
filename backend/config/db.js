const mongoose = require("mongoose");
const dns = require("dns");

// Fix Node.js querySrv ECONNREFUSED on Windows / local ISP DNS by setting public DNS resolvers
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore if restricted
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);

    // If Atlas failed and URI isn't already local, try local MongoDB as fallback
    if (uri && !uri.includes("localhost") && !uri.includes("127.0.0.1")) {
      const fallbackLocalUri = "mongodb://127.0.0.1:27017/collaborative_pm";
      console.log(`Attempting fallback to local MongoDB (${fallbackLocalUri})...`);
      try {
        await mongoose.connect(fallbackLocalUri);
        console.log(`MongoDB connected to local instance: ${mongoose.connection.host}`);
        return;
      } catch (localErr) {
        console.error("Local MongoDB fallback also failed:", localErr.message);
      }
    }

    console.error("\n[DIAGNOSTIC]: If using MongoDB Atlas:");
    console.error("1. Check MongoDB Atlas -> Network Access: ensure 0.0.0.0/0 (or your IP) is whitelisted.");
    console.error("2. If your network/ISP blocks DNS SRV queries, switch back to local MongoDB in backend/.env: MONGODB_URI=mongodb://localhost:27017/collaborative_pm");
    process.exit(1);
  }
};

module.exports = connectDB;
