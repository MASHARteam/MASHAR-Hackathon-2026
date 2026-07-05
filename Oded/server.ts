import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization of GoogleGenAI to prevent server startup crashes when API key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Endpoint to check status and see if Gemini API key is configured
  app.get("/api/config-status", (req, res) => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    res.json({ hasApiKey });
  });

  // Dynamic pathway generator based on the questionnaire
  app.post("/api/generate-pathway", async (req, res) => {
    try {
      const { answers } = req.body;
      if (!answers) {
        return res.status(400).json({ error: "Missing answers in request body" });
      }

      const ai = getAiClient();
      
      const prompt = `
        You are an expert Physics Pedagogical Consultant specializing in integrating AI and Data Science into High School Physics education (Grades 10-12 / י' עד י\"ב) at the Schwartz/Reisman Science Education Center.
        Based on the teacher's/student's preferences, generate a customized, structured 3-year AI skill-building pathway.
        
        User input:
        - AI Knowledge & Experience Level: ${answers.role || "אין לי נסיון קודם"}
        - Current Grade levels to focus on: ${answers.grades ? answers.grades.join(", ") : "10th, 11th, 12th"}
        - Primary learning goals: ${answers.goals ? answers.goals.join(", ") : "Lab data analysis, Simulations, Theoretical understanding"}
        - Student prior experience with Python/Coding: ${answers.priorCoding || "None"}
        - Teacher primary AI tool usage: ${answers.teacherAiUsage || "Lesson plans and lab assignments generator"}
        - Preferred resources/formats: ${answers.resources || "Campus IL, YouTube, Google Colab"}
        - Focus area: ${answers.focusArea || "General Physics Lab & Problem Solving"}

        Please generate a customized curriculum in Hebrew. Return a JSON object matching the exact schema below. Keep descriptions inspiring, practical, and highly relevant to the physics matriculation exam (בגרות בפיזיקה, lab reports, mechanics, electromagnetism, and modern physics).

        The response MUST be a valid JSON object matching this TypeScript structure:
        {
          "title": "Hebrew name of the program",
          "overview": "Hebrew overview of this customized program, explaining how it fits the goals",
          "years": [
            {
              "yearName": "כיתה י' - יסודות",
              "focus": "Brief focus description",
              "skills": ["Skill 1", "Skill 2"],
              "physicsContext": "How this applies to Grade 10 Physics (e.g. Kinematics, Dynamics, Lab measurements)",
              "suggestedResources": [
                { "name": "Resource Name", "platform": "Campus IL/YouTube/etc", "url": "URL or description" }
              ],
              "milestoneProject": "A practical project (e.g. Graphing motion from tracker data using Colab)"
            },
            {
              "yearName": "כיתה י\"א - העמקה",
              "focus": "Brief focus description",
              "skills": ["Skill 1", "Skill 2"],
              "physicsContext": "How this applies to Grade 11 Physics (e.g. Electromagnetism, Circular Motion, advanced lab)",
              "suggestedResources": [
                { "name": "Resource Name", "platform": "Campus IL/YouTube/etc", "url": "URL or description" }
              ],
              "milestoneProject": "A practical project (e.g. Fitting magnetic field lines or simulating a charge in a magnetic field)"
            },
            {
              "yearName": "כיתה י\"ב - יישום ומחקר",
              "focus": "Brief focus description",
              "skills": ["Skill 1", "Skill 2"],
              "physicsContext": "How this applies to Grade 12 Physics (e.g. Modern Physics, Waves, or the Lab Exam - בגרות מעבדה)",
              "suggestedResources": [
                { "name": "Resource Name", "platform": "Campus IL/YouTube/etc", "url": "URL or description" }
              ],
              "milestoneProject": "A final research/lab project report supported by AI and Python"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING },
              years: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    yearName: { type: Type.STRING },
                    focus: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    physicsContext: { type: Type.STRING },
                    suggestedResources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          platform: { type: Type.STRING },
                          url: { type: Type.STRING }
                        },
                        required: ["name", "platform"]
                      }
                    },
                    milestoneProject: { type: Type.STRING }
                  },
                  required: ["yearName", "focus", "skills", "physicsContext", "suggestedResources", "milestoneProject"]
                }
              }
            },
            required: ["title", "overview", "years"]
          }
        }
      });

      const responseText = response.text || "{}";
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Error generating pathway:", error);
      res.status(500).json({ error: error.message || "Failed to generate customized pathway" });
    }
  });

  // Dedicated endpoint for the AI Physics Pedagogical Advisor Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing message parameter" });
      }

      const ai = getAiClient();
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `
            You are "Advisor-PhysicAI" (יועץ פיזיק-AI), a friendly, elite AI pedagogical assistant tailored for physics teachers and high-school students (Grades 10-12) at the Schwartz/Reisman Science Education Center in Israel.
            Your role is to guide teachers and students on how to leverage AI tools (ChatGPT, Gemini, Claude, etc.) and coding (Python, Google Colab, GlowScript/VPython) for:
            1. Lab Report Analysis (fitting lines, calculating linear regression, error bars, Chi-squared, plotting nicely).
            2. Prompt Engineering for Physics (how to prompt AI to explain complex derivations, how to make it act as a Socratic tutor instead of giving the answer).
            3. Simulations (how to generate GlowScript simulations for orbits, pendulums, electromagnetic forces).
            4. Personalizing 3-year skill curriculums.

            Respond warmly, professionally, and clearly in Hebrew. Always highlight practical, physics-oriented benefits. When providing Python code or prompt templates, render them in clean, copyable markdown blocks.
          `,
        }
      });

      // If history is provided, we can send them sequentially or reconstruct (for simple REST call, we'll send the new message with context or start fresh).
      // To keep it robust and simple with the @google/genai SDK, we'll feed the prompt as a message.
      let chatPrompt = "";
      if (history && history.length > 0) {
        chatPrompt = "Here is the conversation history for context:\n" + 
          history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join("\n") + 
          `\n\nUser's current message: ${message}`;
      } else {
        chatPrompt = message;
      }

      const result = await chat.sendMessage({ message: chatPrompt });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Error in AI Chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat message" });
    }
  });

  // Endpoint to generate Python templates for physics lab measurements
  app.post("/api/generate-python", async (req, res) => {
    try {
      const { experimentType, parameters } = req.body;
      const ai = getAiClient();

      const prompt = `
        Create a fully functioning, clean, commented Python code block designed to be run in Google Colab.
        The goal is to analyze data for a high school physics lab experiment: "${experimentType || "General physics lab"}".
        Additional details: ${JSON.stringify(parameters || {})}

        The code MUST:
        1. Import standard data analysis libraries (numpy, matplotlib.pyplot, scipy.optimize).
        2. Contain a mock dataset representing typical measurements (with errors).
        3. Perform linear regression (or curve fitting) using scipy.optimize.curve_fit.
        4. Generate a gorgeous plot using matplotlib, showing:
           - The individual data points as scatter with error bars (plt.errorbar).
           - The fitted theoretical line.
           - Grid lines, titles, and axes in Hebrew (using Hebrew labels or English with descriptive terms if matplotlib font issues are considered, but give Hebrew labels inside comments and instruct how to install hebrew-font or use bilingual labeling).
        5. Print out the fitted parameters (such as acceleration g, friction coefficient, spring constant k, etc.) with their standard errors calculated from the covariance matrix (pcov).
        6. Explain step-by-step in Hebrew comments what each block of code does, so a grade 10-12 student can learn the coding skill.

        Format your entire response as a JSON object:
        {
          "code": "The raw python code block",
          "explanation": "Hebrew explanation of how to use this in Google Colab, what mathematical equations are solved, and how it builds student skills."
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["code", "explanation"]
          }
        }
      });

      const responseText = response.text || "{}";
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("Error generating python code:", error);
      res.status(500).json({ error: error.message || "Failed to generate Python script template" });
    }
  });

  // Serve static assets or mount Vite middleware depending on production status
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`[Physics AI Skills Navigator] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
