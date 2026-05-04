import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const graphFile = path.join(__dirname, "data", "family-graph.json");
const db = createDatabase({ graphFile });
const eventClients = new Set();
const allowOrigin = process.env.ALLOW_ORIGIN || "*";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": allowOrigin
  });
  response.end(JSON.stringify(payload));
}

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", allowOrigin);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
}

async function parseRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(requestPath, response) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const normalizedPath = path.normalize(safePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, normalizedPath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Access-Control-Allow-Origin": allowOrigin
    });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function broadcastGraphUpdate(changeType) {
  const payload = `event: graph-update\ndata: ${JSON.stringify({ changeType, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of eventClients) {
    client.write(payload);
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    setCorsHeaders(response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/graph") {
      const snapshot = await db.getSnapshot();
      sendJson(response, 200, snapshot);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/events") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": allowOrigin
      });
      response.write(`event: ready\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);
      eventClients.add(response);
      request.on("close", () => {
        eventClients.delete(response);
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/people") {
      const payload = await parseRequestBody(request);
      const person = await db.addPerson(payload);
      broadcastGraphUpdate("person-created");
      sendJson(response, 201, { person });
      return;
    }

    if (request.method === "PUT" && url.pathname.startsWith("/api/people/")) {
      if (url.pathname.endsWith("/graph-details")) {
        const personId = url.pathname.split("/").slice(-2)[0];
        const payload = await parseRequestBody(request);
        const person = await db.updatePersonGraphDetails(personId, payload);
        broadcastGraphUpdate("person-graph-details-updated");
        sendJson(response, 200, { person });
        return;
      }
    
      const personId = url.pathname.split("/").pop();
      const payload = await parseRequestBody(request);
      const person = await db.updatePerson(personId, payload);
      broadcastGraphUpdate("person-updated");
      sendJson(response, 200, { person });
      return;
    }


    if (request.method === "POST" && url.pathname === "/api/relationships") {
      const payload = await parseRequestBody(request);
      const relationship = await db.addRelationship(payload);
      broadcastGraphUpdate("relationship-created");
      sendJson(response, 201, { relationship });
      return;
    }

    await serveStatic(url.pathname, response);
  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    sendJson(response, statusCode, {
      error: error.message || "Unexpected error"
    });
  }
});

const port = Number(process.env.PORT || 3000);
const host = "0.0.0.0";

server.listen(port, host, () => {
  console.log(`Family tree app running at http://${host}:${port}`);
});
