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

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  // API Router
  const apiRouter = express.Router();

  apiRouter.get("/ping", (req, res) => {
    console.log("[API] Ping reached");
    res.json({ status: "ok", time: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  apiRouter.post("/proxy/token", async (req, res) => {
    console.log(`[API] Token Refresh Start: ${new Date().toISOString()}`);
    try {
      const { client_id, refresh_token, grant_type } = req.body;
      if (!client_id || !refresh_token) {
        return res.status(400).json({ error: "Missing identity parameters" });
      }

      const params = new URLSearchParams();
      params.append("client_id", client_id);
      params.append("refresh_token", refresh_token);
      params.append("grant_type", grant_type || "refresh_token");

      const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data = await response.json();
      console.log(`[API] Token Result Status: ${response.status}`);
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[API] Token Error:", error);
      res.status(500).json({ error: "Proxy failure", message: error.message });
    }
  });

  apiRouter.get("/proxy/messages", async (req, res) => {
    console.log(`[API] Messages Fetch Start: ${new Date().toISOString()}`);
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

      const graphUrl = "https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,bodyPreview,receivedDateTime,webLink,body&$orderby=receivedDateTime desc";
      const response = await fetch(graphUrl, {
        method: "GET",
        headers: { "Authorization": authHeader, "Accept": "application/json" },
      });

      const data = await response.json();
      console.log(`[API] Messages Result Status: ${response.status}`);
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[API] Messages Error:", error);
      res.status(500).json({ error: "Graph failure", message: error.message });
    }
  });

  // Mount API router
  app.use("/api", apiRouter);

  // API 404
  app.all("/api/*", (req, res) => {
    console.log(`[API] 404 Not Found: ${req.url}`);
    res.status(404).json({ error: "Route not found", path: req.url });
  });

  // Vite / Static files
  if (process.env.NODE_ENV !== "production") {
    console.log("[SYSTEM] Starting in DEVELOPMENT mode (Vite)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SYSTEM] Starting in PRODUCTION mode (Static)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[SYSTEM] Server active on port ${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
