import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import mongoose from 'mongoose';
import { User } from '../user/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function checkSalaries() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({
      status: 'active',
      'jobInfo.department': 'Програмісти'
    }).select('personalInfo.firstName personalInfo.lastName personalInfo.email salaryInfo.baseSalary personalInfo.gender jobInfo.educationLevel');

    console.log(`Users in Програмісти: ${users.length}`);
    console.table(users.map(u => ({
      email: u.personalInfo.email,
      name: `${u.personalInfo.firstName} ${u.personalInfo.lastName}`,
      salary: u.salaryInfo?.baseSalary || 'НЕ ВКАЗАНО',
      gender: u.personalInfo.gender || 'НЕ ВКАЗАНО',
      education: (u as any).personalInfo?.educationLevel || 'НЕ ВКАЗАНО'
    })));

    const withSalary = users.filter(u => u.salaryInfo?.baseSalary && u.salaryInfo.baseSalary > 0);
    console.log(`\nWith salary > 0: ${withSalary.length}`);
    console.log(`With gender: ${users.filter(u => u.personalInfo.gender).length}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSalaries();
