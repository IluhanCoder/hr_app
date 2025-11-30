import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const list = await User.find({ "jobInfo.department": "Програмісти" })
    .select("email personalInfo.firstName personalInfo.lastName jobInfo.department status role createdAt")
    .sort({ createdAt: -1 })
    .lean();
  console.log("Users in 'Програмісти':", list.length);
  console.table(list.map(u => ({ email: u.email, name: `${u.personalInfo?.firstName} ${u.personalInfo?.lastName}`, status: u.status, role: u.role })));
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
