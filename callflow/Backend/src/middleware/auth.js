import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Verifies the JWT cookie and attaches req.user (without the password hash).
export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(sub).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "Session expired" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired" });
  }
}
