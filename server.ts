import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Extend Request type for multer
interface MulterRequest extends Request {
  file?: any;
}

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/analyze", upload.single("resume"), async (req: Request, res: Response) => {
    try {
      const multerReq = req as MulterRequest;
      if (!multerReq.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let resumeText = "";
      if (multerReq.file.mimetype === "application/pdf") {
        const data = await pdf(multerReq.file.buffer);
        resumeText = data.text;
      } else {
        resumeText = multerReq.file.buffer.toString();
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
      }

      const genAI = new GoogleGenAI({ apiKey }) as any;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze this resume and extract:
      1. Primary Job Role (e.g., Software Engineer, Product Manager)
      2. Key Skills (Top 5)
      3. A 1-sentence professional summary.
      
      Respond STRICTLY in JSON format:
      {
        "role": "...",
        "skills": ["...", "..."],
        "summary": "..."
      }
      
      Resume text:
      ${resumeText.substring(0, 5000)}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from potential markdown blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      res.status(500).json({ error: "Failed to analyze resume" });
    }
  });

  // Mock Job Database Generation
  app.post("/api/match-jobs", (req, res) => {
    const { role, skills } = req.body;
    
    // Generate 6-8 mock companies based on the role
    const companies = [
      "TechNova Solutions", "Stellar Systems", "Quantum Leap", "Pulse Digital", 
      "Nebula Innovations", "Apex Cloud", "Vertex AI", "Horizon Global",
      "InfiniCore", "Echo Systems", "Nimbus Labs", "Zenith Tech"
    ].sort(() => 0.5 - Math.random()).slice(0, 8);

    const jobs = companies.map(company => ({
      id: Math.random().toString(36).substr(2, 9),
      company,
      title: `${role} (${Math.random() > 0.5 ? 'Senior' : 'Mid-Level'})`,
      location: ["Remote", "New York, NY", "San Francisco, CA", "London, UK", "Singapore"][Math.floor(Math.random() * 5)],
      matchScore: Math.floor(Math.random() * 20) + 80,
      salary: `$${Math.floor(Math.random() * 100) + 80}k - $${Math.floor(Math.random() * 100) + 180}k`
    }));

    res.json({ jobs });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
