require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

function stripCodeFences(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseModelJson(text) {
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const startIndex = cleaned.indexOf("{");
    const endIndex = cleaned.lastIndexOf("}");

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      return JSON.parse(cleaned.slice(startIndex, endIndex + 1));
    }

    throw new Error("Failed to parse extracted JSON");
  }
}

app.get("/test", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent("Say hello in one sentence.");
    const text = result.response.text();
    res.send(text);
  } catch (error) {
    console.error("Error generating text:", error);
    res.status(500).json({ error: "Failed to generate text" });
  }
});

app.post("/extract", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString("base64");

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent([
      "Extract these fields from this form as JSON: name, email, phone, dob, gender, course, year, roll number. Return raw JSON only, no markdown formatting, no code fences.",
      {
        inlineData: {
          data: base64Image,
          mimeType: req.file.mimetype,
        },
      },
    ]);

    const data = parseModelJson(result.response.text());
    res.json(data);
  } catch (error) {
    console.error("Error extracting data:", error);
    res.status(500).json({ error: "Failed to extract data" });
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => { });
    }
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000/test");
});