import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../user/user.model.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected (check education JS)');

  const users = await User.find({ 'jobInfo.department': 'Програмісти' })
    .select({ email: 1, 'personalInfo.education': 1, 'personalInfo.educationLevel': 1 })
    .lean();

  const rows = users.map(u => ({
    email: u.email,
    education: u.personalInfo?.education ?? '-',
    educationLevel: u.personalInfo?.educationLevel ?? '-',
  }));

  console.table(rows);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});