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
    console.log(`[SERVER] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong", time: new Date().toISOString() });
  });
  
  // Proxy for Microsoft Token Refresh
  app.post(["/api/proxy/token", "/api/proxy/token/"], async (req: any, res: any) => {
    console.log(`[API] POST /api/proxy/token - ${new Date().toISOString()}`);
    try {
      const { client_id, refresh_token, grant_type } = req.body;
      if (!client_id || !refresh_token) {
        console.error("[API] Missing parameters");
        return res.status(400).json({ error: "Missing client_id or refresh_token" });
      }

      console.log(`[API] Refreshing for client: ${client_id}`);
      
      const params = new URLSearchParams();
      params.append("client_id", client_id);
      params.append("refresh_token", refresh_token);
      params.append("grant_type", grant_type || "refresh_token");

      const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data: any = await response.json();
      console.log(`[API] Microsoft Result: ${response.status}`);
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[API] Proxy Error:", error);
      res.status(500).json({ error: "Internal Proxy Error", details: error.message });
    }
  });

  // Proxy for Microsoft Graph API
  app.get(["/api/proxy/messages", "/api/proxy/messages/"], async (req: any, res: any) => {
    console.log(`[API] GET /api/proxy/messages - ${new Date().toISOString()}`);
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Missing Authorization header" });
      }

      const graphUrl = "https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,bodyPreview,receivedDateTime,webLink,body&$orderby=receivedDateTime desc";
      
      const response = await fetch(graphUrl, {
        method: "GET",
        headers: {
          "Authorization": authHeader,
          "Accept": "application/json",
        },
      });

      const data: any = await response.json();
      console.log(`[API] Graph Result: ${response.status}`);
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("[API] Graph Error:", error);
      res.status(500).json({ error: "Internal Graph Error", details: error.message });
    }
  });

  // API 404 Handler (only for /api prefix)
  app.all("/api/*", (req, res) => {
    console.log(`[API] 404: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route Not Found", method: req.method, url: req.url });
  });

  // Vite middleware for development
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
    console.log(`[SYSTEM] Server started in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[SYSTEM] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
