import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../user/user.model.js';

dotenv.config();

function pickEducation(dept?: string, level?: string) {
  const techFields = [
    'Computer Science',
    'Software Engineering',
    'Information Systems',
    'Applied Mathematics',
    'Data Science',
    'Computer Engineering',
    'Artificial Intelligence',
    'Cybersecurity',
  ];
  const businessFields = ['Business Administration', 'Economics', 'Finance', 'Management'];
  const hrFields = ['Human Resources', 'Psychology', 'Sociology'];

  const byDept: Record<string, string[]> = {
    'Програмісти': techFields,
    'HR': hrFields,
    'Бізнес': businessFields,
  };

  const pool = dept && byDept[dept] ? byDept[dept] : techFields;

  const top = ['Master', 'PhD'].includes(level || '') ? pool.slice(0, Math.ceil(pool.length * 0.6)) : pool;
  return top[Math.floor(Math.random() * top.length)];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected (migration: add education)');

  const users = await User.find({}).select({
    _id: 1,
    email: 1,
    'jobInfo.department': 1,
    'personalInfo.education': 1,
    'personalInfo.educationLevel': 1,
  });

  let updated = 0;
  for (const u of users) {
    const hasEducation = (u as any).personalInfo?.education;
    if (!hasEducation) {
      const dept = (u as any).jobInfo?.department;
      const level = (u as any).personalInfo?.educationLevel;
      const edu = pickEducation(dept, level);

      const res = await User.updateOne(
        { _id: (u as any)._id },
        { $set: { 'personalInfo.education': edu } }
      );
      updated += res.modifiedCount || 0;
      console.log(`📘 ${u.email} -> ${edu} (modified=${res.modifiedCount})`);
    }
  }

  console.log(`🏁 Migration complete. Users updated: ${updated}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
