import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { config } from "dotenv";
import userRouter from "./user/user.routes.js";
import departmentRouter from "./department/department.routes.js";
import leaveRouter from "./leave/leave.routes.js";
import goalRouter from "./goal/goal.routes.js";
import reviewRouter from "./review/review.routes.js";
import highPotentialRouter from "./highPotential/highPotential.routes.js";
import recruitmentRouter from "./recruitment/recruitment.routes.js";
import reportsRouter from "./reports/reports.routes.js";
import migrateRouter from "./scripts/migrate.routes.js";
import skillsRouter from "./skills/skills.routes.js";
import analyticsRouter from "./analytics/analytics.routes.js";
import timeRouter from "./time/time.routes.js";
import { calculatePayroll, calculateTeamPayroll } from "./payroll/payroll.controller.js";
import { generatePayslipPdf } from "./payroll/payslip.controller.js";
import { authMiddleware } from "./auth/auth.middleware.js";

config();

const app = express();

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI environment variable");
  process.exit(1);
}
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", userRouter);
app.use("/api", departmentRouter);
app.use("/api", leaveRouter);
app.use("/api", goalRouter);
app.use("/api", reviewRouter);
app.use("/api/high-potential", highPotentialRouter);
app.use("/api/recruitment", recruitmentRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/migrate", migrateRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api", timeRouter);

app.get("/api/payslip/pdf", authMiddleware, (req, res) => generatePayslipPdf(req as any, res));
app.post("/api/payroll/calculate", authMiddleware, (req, res) => calculatePayroll(req as any, res));
app.post("/api/payroll/calculate-team", authMiddleware, (req, res) => calculateTeamPayroll(req as any, res));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HR Management System API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Client URL: ${CLIENT_URL}`);
});

export default app;