// Loads .env before any other module reads process.env.
// Import this FIRST (ES module imports run in order, before the rest of index.js).
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config(); // current folder
dotenv.config({ path: path.resolve(dir, "../.env") }); // Backend folder
dotenv.config({ path: path.resolve(dir, "../../.env") }); // project root
