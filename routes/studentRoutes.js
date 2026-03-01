import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addStudent,
  getStudents,
  updateStudent,
  deleteStudent
} from "../controllers/studentController.js";
import multer from "multer";
import { uploadStudents } from "../controllers/studentController.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", protect, addStudent);
router.get("/:classId", protect, getStudents);

router.put("/:id", protect, updateStudent);
router.delete("/:id", protect, deleteStudent);
router.post("/upload", protect, upload.single("file"), uploadStudents);

export default router;
