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

  // 1. RAW API ROUTES (BEFORE ANY MIDDLEWARE)
  app.get("/api/ping", (req, res) => {
    console.log("[DEBUG] Ping hit at top level");
    res.json({ ok: true, source: "top-level" });
  });

  app.use(express.json());

  // 2. Logging middleware
  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) {
      console.log(`[EARLY API CHECK] ${req.method} ${req.url}`);
    }
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  // API Router
  const api = express.Router();

  api.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for Microsoft Token Refresh
  api.post("/proxy/token", async (req, res) => {
    console.log("[API] Token proxy request");
    try {
      const { client_id, refresh_token, grant_type } = req.body;
      if (!client_id || !refresh_token) {
        return res.status(400).json({ error: "Missing client_id or refresh_token" });
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
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[API ERROR] Token Proxy:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

  // Proxy for Microsoft Graph API
  api.get("/proxy/messages", async (req, res) => {
    console.log("[API] Messages proxy request");
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const graphUrl = "https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,bodyPreview,receivedDateTime,webLink,body&$orderby=receivedDateTime desc";
      const response = await fetch(graphUrl, {
        method: "GET",
        headers: { "Authorization": authHeader, "Accept": "application/json" },
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[API ERROR] Messages Proxy:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });

  // API 404 - anything starting with /api/ that didn't match above
  api.all("*", (req, res) => {
    console.log(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route Not Found", path: req.originalUrl });
  });

  // Mount API router
  app.use("/api", api);

  // Frontend Serving
  if (process.env.NODE_ENV !== "production") {
    console.log("[SYSTEM] Initializing Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SYSTEM] Serving static files from dist/");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[SYSTEM FATAL] Failed to start server:", err);
});

