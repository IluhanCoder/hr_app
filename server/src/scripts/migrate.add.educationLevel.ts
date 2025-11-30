import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../user/user.model.js';

dotenv.config();

function pickEducationLevel(dept?: string) {

  const devLevels = ['Bachelor', 'Bachelor', 'Master', 'Master', 'PhD'];
  const hrLevels = ['Bachelor', 'Master'];
  const bizLevels = ['Bachelor', 'Master'];
  const defaultLevels = ['Bachelor', 'Master'];

  let pool = defaultLevels;
  if (dept === 'Програмісти') pool = devLevels;
  else if (dept === 'HR') pool = hrLevels;
  else if (dept === 'Бізнес') pool = bizLevels;

  return pool[Math.floor(Math.random() * pool.length)];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected (migration: add educationLevel)');

  const users = await User.find({}).select({
    _id: 1,
    email: 1,
    'jobInfo.department': 1,
    'personalInfo.educationLevel': 1,
  });

  let updated = 0;
  for (const u of users) {
    const hasLevel = (u as any).personalInfo?.educationLevel;
    if (!hasLevel) {
      const dept = (u as any).jobInfo?.department;
      const level = pickEducationLevel(dept);
      const res = await User.updateOne(
        { _id: (u as any)._id },
        { $set: { 'personalInfo.educationLevel': level } }
      );
      updated += res.modifiedCount || 0;
      console.log(`📘 ${u.email} -> ${level} (modified=${res.modifiedCount})`);
    }
  }

  console.log(`🏁 Migration complete. Users updated: ${updated}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
