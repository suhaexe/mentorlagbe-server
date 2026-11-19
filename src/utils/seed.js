import mongoose from "mongoose";
import dotenv from "dotenv";
import Tuition from "../models/Tuition.js";

dotenv.config();

const subjects = ["Mathematics", "Physics", "Chemistry", "Programming", "IELTS", "English"];
const classLevels = ["Class 8", "Class 9", "Class 10", "HSC", "Admission"];
const modes = ["Online", "Offline"];

const seedData = Array.from({ length: 12 }).map((_, i) => ({
  title: `Expert ${subjects[i % subjects.length]} Tuition for ${classLevels[i % classLevels.length]}`,
  subject: subjects[i % subjects.length],
  classLevel: classLevels[i % classLevels.length],
  mode: modes[i % modes.length],
  location: "Dhaka",
  monthlyFee: 2000 + i * 500,
  daysPerWeek: 3,
  bannerImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
  description: "Comprehensive tuition batch covering the full syllabus with weekly exams and personalized attention.",
  tutorName: `Tutor ${i + 1}`,
  tutorEmail: "tutor@mentorlagbe.com",
  approvalStatus: "approved",
  isActive: true,
}));

const runSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Tuition.deleteMany({});
    await Tuition.insertMany(seedData);
    console.log("12 Tuitions seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runSeed();