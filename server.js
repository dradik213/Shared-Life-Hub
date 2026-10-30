import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT) || 3e3;
app.use(express.json());
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
app.post("/api/gemini/parse-event", async (req, res) => {
  try {
    const { prompt, referenceDate, existingCategories } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const refDate = referenceDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const systemInstruction = `You are an expert shared calendar assistant for couples and shared households.
Your job is to parse the user's natural language request or email/message snippet into a structured calendar event.
Today's reference date is: ${refDate}.

You must return valid JSON with the following structure:
{
  "title": "Clean, descriptive event title",
  "category": "market" | "dinner_date" | "maintenance" | "pets" | "grocery_errand" | "other",
  "emoji": "\u{1F3AA}" | "\u{1F37D}\uFE0F" | "\u{1F528}" | "\u{1F43E}" | "\u{1F6D2}" | "\u{1F4C5}",
  "startDate": "YYYY-MM-DD",
  "startTime": "HH:MM" (24h format, optional or empty string if not specified),
  "endTime": "HH:MM" (optional or empty string),
  "locationName": "Location name or address if available",
  "assignedTo": "both" | "her" | "him",
  "notes": "Any helpful context, instructions, or highlights from the email/prompt",
  "tasks": ["Task 1", "Task 2"],
  "summaryExplanation": "Brief 1-sentence explanation of what was extracted"
}

Category matching guide:
- "market": Pop-up markets, craft shows, vendor booths, sales.
- "dinner_date": Restaurant, date night, movie, anniversary, romantic drinks.
- "maintenance": Household repairs, plumbing, tools, contractor visits, HVAC.
- "pets": Vet appointments, dog walking, grooming, medication.
- "grocery_errand": Supermarket, Costco, shopping, pickup, post office.
- "other": Flight, doctor appointment, party, general shared schedule.

Strictly output ONLY the JSON object, no Markdown code fences, no extra text.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Request to schedule: ${prompt}` }]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }
    return res.json(parsed);
  } catch (err) {
    console.error("Error in /api/gemini/parse-event:", err);
    return res.status(500).json({ error: err.message || "Failed to parse event with Gemini" });
  }
});
app.post("/api/gemini/analyze-emails", async (req, res) => {
  try {
    const { emailSnippets, referenceDate } = req.body;
    if (!emailSnippets || !Array.isArray(emailSnippets)) {
      return res.status(400).json({ error: "emailSnippets array is required" });
    }
    const refDate = referenceDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const systemInstruction = `You are a personal intelligence assistant for a shared household calendar.
You analyze incoming Gmail messages to extract action items, deadlines, things the user might have forgotten, reservations, bills to pay, appointments, and shared activities.
Current reference date: ${refDate}.

Return a JSON array of actionable insights:
[
  {
    "id": "insight-1",
    "sourceEmailId": "string id",
    "subject": "Subject of the email",
    "sender": "Sender name or email",
    "importance": "high" | "medium" | "low",
    "category": "action_required" | "appointment" | "deadline" | "reservation" | "reminder",
    "summary": "Clear, concise summary of what needs attention",
    "suggestedEvent": {
      "title": "Title for event",
      "startDate": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "category": "market" | "dinner_date" | "maintenance" | "pets" | "grocery_errand" | "other",
      "notes": "Context"
    } or null,
    "suggestedTask": "Actionable to-do task title to add to backlog or day checklist"
  }
]

Strictly return ONLY the JSON array.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze these email summaries:
${JSON.stringify(emailSnippets, null, 2)}` }]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "[]";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }
    return res.json(parsed);
  } catch (err) {
    console.error("Error in /api/gemini/analyze-emails:", err);
    return res.status(500).json({ error: err.message || "Failed to analyze emails with Gemini" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
}
startServer();
