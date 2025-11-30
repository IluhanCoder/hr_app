import mongoose from "mongoose";
import { config } from "dotenv";

config();

const CLUSTER_URI = process.env.MONGODB_URI?.split("/")[0]?.startsWith("mongodb+srv")
  ? process.env.MONGODB_URI!.split("/")[0]
  : process.env.MONGODB_URI || "mongodb://localhost:27017";

const baseParams = "?retryWrites=true&w=majority&appName=Cluster0";

const SRC_DB = "hr_app";
const DST_DB = "test";

const srcUri = `${CLUSTER_URI}/${SRC_DB}${baseParams}`;
const dstUri = `${CLUSTER_URI}/${DST_DB}${baseParams}`;

const userEmails = [
  "dev.junior1@example.com",
  "dev.junior2@example.com",
];

const candidateEmails = [
  "maria.sydorenko+jr.react@example.com",
  "oleg.kovalenko+jr.react@example.com",
];

async function run() {
  const src = await mongoose.createConnection(srcUri).asPromise();
  const dst = await mongoose.createConnection(dstUri).asPromise();

  console.log(`✅ Connected src=${SRC_DB}, dst=${DST_DB}`);

  const srcUsers = src.collection("users");
  const dstUsers = dst.collection("users");
  const srcCandidates = src.collection("candidates");
  const dstCandidates = dst.collection("candidates");

  for (const email of userEmails) {
    const doc = await srcUsers.findOne({ email });
    if (!doc) {
      console.log(`ℹ️  User not found in ${SRC_DB}: ${email}`);
      continue;
    }

    const { _id, ...rest } = doc as any;
    const res = await dstUsers.updateOne(
      { email },
      { $set: rest, $setOnInsert: { _id } },
      { upsert: true }
    );
    console.log(`👤 Upsert user ${email}: matched=${res.matchedCount} upserted=${res.upsertedCount}`);
  }

  for (const email of candidateEmails) {
    const doc = await srcCandidates.findOne({ email });
    if (!doc) {
      console.log(`ℹ️  Candidate not found in ${SRC_DB}: ${email}`);
      continue;
    }
    const { _id, ...rest } = doc as any;
    const res = await dstCandidates.updateOne(
      { email },
      { $set: rest, $setOnInsert: { _id } },
      { upsert: true }
    );
    console.log(`👥 Upsert candidate ${email}: matched=${res.matchedCount} upserted=${res.upsertedCount}`);
  }

  await src.close();
  await dst.close();
  console.log("🏁 Migration finished");
}

run().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
