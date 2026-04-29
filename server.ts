import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. TOP LEVEL DEBUGGING
  app.use((req, res, next) => {
    console.log(`[EARLY] ${req.method} ${req.url}`);
    next();
  });

  // 2. ABSOLUTE TOP LEVEL ROUTES (NO ROUTER, BEFORE JSON MIDDLEWARE)
  app.get("/api/ping", (req, res) => {
    console.log("[HIT] /api/ping");
    res.json({ ok: true, source: "top-level", env: process.env.NODE_ENV });
  });

  app.use(express.json());

  // 3. PROXY ROUTES
  app.post("/api/proxy/token", async (req, res) => {
    console.log(`[HIT] /api/proxy/token - ${JSON.stringify(req.body)}`);
    try {
      const { client_id, refresh_token } = req.body;
      if (!client_id || !refresh_token) {
        return res.status(400).json({ error: "Missing parameters" });
      }

      const params = new URLSearchParams();
      params.append("client_id", client_id);
      params.append("refresh_token", refresh_token);
      params.append("grant_type", "refresh_token");

      const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[ERROR] Token Proxy:", error);
      res.status(500).json({ error: "Proxy failure", message: error.message });
    }
  });

  app.get("/api/proxy/messages", async (req, res) => {
    console.log("[HIT] /api/proxy/messages");
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

      const response = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,bodyPreview,receivedDateTime,webLink,body&$orderby=receivedDateTime desc", {
        method: "GET",
        headers: { "Authorization": authHeader, "Accept": "application/json" },
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[ERROR] Graph Fetch:", error);
      res.status(500).json({ error: "Graph failure", message: error.message });
    }
  });

  // 4. Vite / Static
  if (process.env.NODE_ENV !== "production") {
    console.log("[INFO] Mounting Vite dev middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[INFO] Serving static files");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.url.startsWith("/api/")) return res.status(404).json({ error: "Not Found" });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[READY] Server active on port ${PORT}`);
  });
}

startServer();
