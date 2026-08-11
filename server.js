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

    const text = result.response.text();
    res.send(text);
  } catch (error) {
    console.error("Error extracting data:", error);
    res.status(500).json({ error: "Failed to extract data" });
  }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000/test");
});