const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI; // <-- put your MongoDB connection string

// Match your existing schema & collection name
const messageSchema = new mongoose.Schema({}, { collection: "messages" });
const Message = mongoose.model("Message", messageSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await Message.deleteMany({});
    console.log(`🧹 Deleted ${result.deletedCount} messages`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
