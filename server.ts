import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
      console.warn("[Server] GEMINI_API_KEY is not set in environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const DECOMPOSITION_MODEL = "gemini-3.1-pro-preview";
const EXECUTION_MODEL = "gemini-3.8-flash";

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Ava Modules Status
app.get("/api/modules", async (_req, res) => {
  const moduleDefs = [
    { name: "ava-langgraph-prompt-decomposition-engine", defaultVersion: "0.1.8" },
    { name: "ava-langchain-prompt-decomposition", defaultVersion: "0.1.9" },
    { name: "ava-langgraph-narrative-intelligence", defaultVersion: "0.1.3" },
    { name: "ava-langchain-relational-intelligence", defaultVersion: "0.1.9" },
    { name: "ava-langchain-narrative-tracing", defaultVersion: "0.1.9" },
  ];

  const results = await Promise.all(
    moduleDefs.map(async (mod) => {
      let version = mod.defaultVersion;
      try {
        const pkgPath = path.join(process.cwd(), "node_modules", mod.name, "package.json");
        if (fs.existsSync(pkgPath)) {
          const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          if (pkgJson.version) {
            version = pkgJson.version;
          }
        }
      } catch {
        // use defaultVersion
      }

      try {
        await import(mod.name);
        return { name: mod.name, status: "active" as const, version };
      } catch (err) {
        console.warn(`[Modules] Failed to load ${mod.name}:`, err);
        return { name: mod.name, status: "error" as const, version };
      }
    })
  );

  res.json(results);
});

// Prompt Decomposition
app.post("/api/decompose", async (req, res) => {
  try {
    const { prompt, engineType = "langgraph" } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const trimmedPrompt = prompt.trim();
    let result: any = null;

    // Attempt to use installed Ava decomposition engine packages if available
    try {
      const packageName =
        engineType === "langgraph"
          ? "ava-langgraph-prompt-decomposition-engine"
          : "ava-langchain-prompt-decomposition";

      const module = await import(packageName);
      if (typeof module.decompose === "function") {
        const engineResult = await module.decompose(trimmedPrompt);
        if (engineResult && engineResult.decomposition) {
          const dec = engineResult.decomposition;
          const actionStack = dec.actionStack || [];
          if (actionStack.length > 0) {
            const tasks = actionStack.map((action: any, index: number) => {
              const direction = action.direction || "east";
              const taskType =
                direction === "east"
                  ? "creative"
                  : direction === "south"
                  ? "research"
                  : direction === "west"
                  ? "review"
                  : "reasoning";

              return {
                id: action.id || `task-${index + 1}`,
                title: action.text || `Action Step ${index + 1}`,
                description: `Directional ${direction.toUpperCase()} quadrant step: ${action.text || "Execution step"}`,
                dependencies: action.dependency ? [action.dependency] : [],
                estimatedComplexity:
                  action.urgency === "immediate" ? "High" : "Medium",
                taskType,
                recommendedTools: [
                  engineType === "langgraph"
                    ? "LangGraph StateGraph"
                    : "LangChain Runnable",
                ],
                reasoningStrategy: `Action quadrant: ${direction}. Urgency: ${action.urgency || "session"}. Confidence: ${Math.round((action.confidence || 0.8) * 100)}%`,
              };
            });

            result = {
              originalPrompt: trimmedPrompt,
              tasks,
              reasoning: `${
                engineType === "langgraph" ? "Ava LangGraph" : "Ava LangChain"
              } native engine decomposed this prompt across the 4 Medicine Wheel quadrants (Lead: ${dec.leadDirection || "east"}).`,
            };
          }
        }
      }
    } catch (engineError) {
      console.warn("[Decompose] Ava package decomposition failed, using Gemini model fallback:", engineError);
    }

    // Fallback to Gemini 3.1 Pro Preview structured output
    if (!result) {
      const ai = getAI();
      const enginePersona =
        engineType === "langgraph"
          ? "Ava LangGraph Engine v0.1.8 (Stateful, Cyclic, Actor-based)"
          : "Ava LangChain Engine v0.1.9 (Linear, Chain-based, Traceable)";

      const styleInstruction =
        engineType === "langgraph"
          ? "Focus on identifying independent actors, complex dependencies, and potential feedback loops."
          : "Focus on a clear, step-by-step linear chain of thought decomposition.";

      const response = await ai.models.generateContent({
        model: DECOMPOSITION_MODEL,
        contents: `You are the ${enginePersona}.
Your goal is to break down the following complex user prompt into a series of atomic, executable sub-tasks.
${styleInstruction}

User Prompt: "${trimmedPrompt}"`,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reasoning: {
                type: Type.STRING,
                description: `High-level strategy using ${engineType} architecture`,
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    dependencies: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of task IDs that must be completed before this one.",
                    },
                    estimatedComplexity: {
                      type: Type.STRING,
                      enum: ["Low", "Medium", "High"],
                    },
                    taskType: {
                      type: Type.STRING,
                      enum: ["research", "reasoning", "coding", "creative", "review"],
                      description: "The primary nature of this task.",
                    },
                    recommendedTools: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Suggested tools to accomplish this task",
                    },
                    reasoningStrategy: {
                      type: Type.STRING,
                      description: "A brief note on the strategic purpose of this task.",
                    },
                  },
                  required: [
                    "id",
                    "title",
                    "description",
                    "dependencies",
                    "estimatedComplexity",
                    "taskType",
                    "reasoningStrategy",
                  ],
                },
              },
            },
            required: ["reasoning", "tasks"],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        result = {
          originalPrompt: trimmedPrompt,
          tasks: parsed.tasks,
          reasoning: parsed.reasoning,
        };
      } else {
        throw new Error("Empty response from decomposition model.");
      }
    }

    return res.json(result);
  } catch (error: any) {
    console.error("[Decompose] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to decompose prompt" });
  }
});

// Task Execution
app.post("/api/execute", async (req, res) => {
  try {
    const { taskTitle, taskDescription, context = "" } = req.body;
    if (!taskTitle) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: EXECUTION_MODEL,
      contents: `
Task Title: ${taskTitle}
Task Description: ${taskDescription || ""}

Context from previous steps:
${context}

Please execute this task and provide a concise, high-quality output.`,
    });

    return res.json({ output: response.text || "No output generated." });
  } catch (error: any) {
    console.error("[Execute] Error:", error);
    return res
      .status(500)
      .json({ error: error.message || `Execution failed for task: ${req.body?.taskTitle}` });
  }
});

// Vite middleware for development, static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ava Decomposer Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
