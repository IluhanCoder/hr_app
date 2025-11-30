import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";
import { TimeEntry, TimeEntryStatus, TimeEntryType } from "../time/timeEntry.model.js";

config();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const users = await User.find({ status: "active" }).limit(10);
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const startDay = new Date(y, m, 1);

  let created = 0;
  for (const u of users) {
    for (let d = 1; d <= 10; d++) {
      const date = new Date(y, m, d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const start = new Date(y, m, d, 9, 0, 0);
      const end = new Date(y, m, d, 18, 0, 0);
      await TimeEntry.create({
        userId: u._id,
        date,
        start,
        end,
        breakMinutes: 60,
        type: TimeEntryType.REGULAR,
        status: TimeEntryStatus.APPROVED,
        approvedBy: u._id,
        approvedAt: new Date(),
      });
      created++;
    }
  }

  console.log(`✅ Seeded ${created} approved time entries`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
