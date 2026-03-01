import Faculty from "../models/Faculty.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

export const registerFaculty = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await Faculty.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await Faculty.create({ name, email, password: hashed });

    res.json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const loginFaculty = async (req, res) => {
  const { email, password } = req.body;

  const faculty = await Faculty.findOne({ email });
  if (!faculty) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, faculty.password);
  if (!match) return res.status(401).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: faculty._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    facultyId: faculty._id,
    name: faculty.name,
    email: faculty.email
  });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const faculty = await Faculty.findOne({ email });
  if (!faculty) {
    return res.json({ message: "If email exists, reset link sent" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  faculty.resetToken = token;
  faculty.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
  await faculty.save();

  const resetLink = `https://digittence-be.onrender.com/reset-password/${token}`;

  await sendEmail(
    faculty.email,
    "Digittence Password Reset",
    `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `
  );

  res.json({ message: "Password reset link sent to email" });
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const faculty = await Faculty.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!faculty) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const hashed = await bcrypt.hash(password, 10);
  faculty.password = hashed;
  faculty.resetToken = undefined;
  faculty.resetTokenExpiry = undefined;

  await faculty.save();

  res.json({ message: "Password reset successful" });
};