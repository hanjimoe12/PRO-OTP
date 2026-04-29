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

  const serverLogs: string[] = [];
  app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url}`;
    console.log(log);
    serverLogs.push(log);
    if (serverLogs.length > 50) serverLogs.shift();
    next();
  });
  app.use(express.json());

  app.get("/api/logs", (req, res) => {
    res.json(serverLogs);
  });

  app.all("/api/ping", (req, res) => {
    res.status(200).json({ ok: true, pong: true, env: process.env.NODE_ENV });
  });

  app.all("/api/proxy/token", async (req: any, res: any) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    try {
      const { client_id, refresh_token } = req.body;
      if (!client_id || !refresh_token) {
        return res.status(400).json({ error: "Missing identity parameters" });
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
      res.status(500).json({ error: "Proxy failure", message: error.message });
    }
  });

  app.all("/api/proxy/messages", async (req: any, res: any) => {
    if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
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
      res.status(500).json({ error: "Proxy failure", message: error.message });
    }
  });

  // 4. Vite / Static
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
      // Don't catch /api requests that fell through
      if (req.url.startsWith("/api")) {
        return res.status(404).json({ error: "API Route Not Found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM] Server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();

