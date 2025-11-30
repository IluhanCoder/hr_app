import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { User } from "../user/user.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const password = "123456";
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const result = await User.updateMany(
    {},
    { $set: { passwordHash: hash } }
  );

  console.log(`✅ Updated ${result.modifiedCount} users with password '123456'`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
