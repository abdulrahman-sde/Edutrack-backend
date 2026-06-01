import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import teachersRoutes from "./modules/teachers/teachers.routes.js";
import institutionsRoutes from "./modules/institutions/institutions.routes.js";
import classesRoutes from "./modules/classes/classes.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import subjectsRoutes from "./modules/subjects/subjects.routes.js";
import studentsRoutes from "./modules/students/students.routes.js";
import examsRoutes from "./modules/exams/exams.routes.js";
import resourcesRoutes from "./modules/resources/resources.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

if (!process.env["DATABASE_URL"]) {
  try {
    process.loadEnvFile();
  } catch (e) {
    // ignore
  }
}

const app = express();
const PORT = process.env["PORT"] ?? 4000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/teachers", teachersRoutes);
app.use("/api/institutions", institutionsRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/classes", attendanceRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/exams", examsRoutes);
app.use("/api", resourcesRoutes);
app.use("/api/reports", reportsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
