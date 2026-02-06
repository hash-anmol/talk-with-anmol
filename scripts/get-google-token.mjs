#!/usr/bin/env node

/**
 * Google OAuth Token Generator
 * 
 * This script helps you generate a refresh token for Google Calendar and Gmail APIs.
 * 
 * Usage:
 *   node scripts/get-google-token.mjs
 * 
 * Prerequisites:
 *   1. Create OAuth 2.0 credentials in Google Cloud Console
 *   2. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
 *   3. Add http://localhost:3333/callback as an Authorized Redirect URI in your OAuth client
 */

import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

// Read environment variables from .env.local
function loadEnv() {
  try {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    const env = {};
    for (const line of lines) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    }
    return env;
  } catch (error) {
    console.error("Error reading .env.local:", error.message);
    process.exit(1);
  }
}

const env = loadEnv();
const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:3333/callback";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",  // Full calendar access (includes freebusy + events)
  "https://www.googleapis.com/auth/gmail.send",
];

// Build the authorization URL
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPES.join(" "));
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\n========================================");
console.log("  Google OAuth Token Generator");
console.log("========================================\n");
console.log("Step 1: Make sure you've added this redirect URI to your Google OAuth client:");
console.log(`        ${REDIRECT_URI}\n`);
console.log("Step 2: Open this URL in your browser to authenticate:\n");
console.log(`  ${authUrl.toString()}\n`);
console.log("Step 3: After you authorize, you'll be redirected back here.\n");
console.log("Waiting for callback...\n");

// Start local server to receive the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    
    if (error) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`<h1>Error: ${error}</h1><p>Please try again.</p>`);
      console.error(`\nError: ${error}`);
      server.close();
      process.exit(1);
    }
    
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<h1>Error: No authorization code received</h1>");
      server.close();
      process.exit(1);
    }
    
    // Exchange code for tokens
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        }),
      });
      
      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        throw new Error(tokens.error_description || tokens.error);
      }
      
      const refreshToken = tokens.refresh_token;
      
      if (!refreshToken) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>Error: No refresh token received</h1><p>Make sure you revoked previous access and try again with prompt=consent</p>");
        console.error("\nNo refresh token received. Try revoking access at https://myaccount.google.com/permissions and run this script again.");
        server.close();
        process.exit(1);
      }
      
      // Success response
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html>
          <head><title>Success!</title></head>
          <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1 style="color: green;">Success!</h1>
            <p>Your refresh token has been generated. You can close this window.</p>
            <p>Check your terminal for instructions.</p>
          </body>
        </html>
      `);
      
      console.log("\n========================================");
      console.log("  SUCCESS! Token Generated");
      console.log("========================================\n");
      console.log("Add this line to your .env.local file:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${refreshToken}\n`);
      console.log("========================================\n");
      
      // Optionally append to .env.local
      const existingEnv = fs.readFileSync(envPath, "utf-8");
      if (!existingEnv.includes("GOOGLE_REFRESH_TOKEN=")) {
        fs.appendFileSync(envPath, `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`);
        console.log("Token has been automatically added to .env.local\n");
      } else {
        console.log("Note: GOOGLE_REFRESH_TOKEN already exists in .env.local");
        console.log("Please update it manually if needed.\n");
      }
      
      server.close();
      process.exit(0);
      
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<h1>Error exchanging code for tokens</h1><p>${error.message}</p>`);
      console.error("\nError exchanging code for tokens:", error.message);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3333, () => {
  console.log("Local server started on http://localhost:3333");
  console.log("Waiting for OAuth callback...\n");
  
  // Try to open the browser automatically
  const openCommand = process.platform === "darwin" ? "open" : 
                      process.platform === "win32" ? "start" : "xdg-open";
  import("child_process").then(({ exec }) => {
    exec(`${openCommand} "${authUrl.toString()}"`);
  }).catch(() => {
    // If we can't open the browser, user will need to do it manually
  });
});
