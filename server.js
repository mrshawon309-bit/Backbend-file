// server.js: backend for the Abdullahcam app
// Run: npm i express cors  →  node server.js

const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // later, restrict to your front-end domain: cors({ origin: "https://yoursite.com" })

const PORT = process.env.PORT || 3000;
const PROVIDER_URL = process.env.PROVIDER_URL; // your licensed provider's endpoint
const PROVIDER_KEY = process.env.PROVIDER_KEY; // your provider's API key

const INSTAGRAM_RE = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+/i;

// Health check (Render uses this to see the service is alive)
app.get("/", (req, res) => res.send("Backend is running"));

app.post("/api/resolve", async (req, res) => {
  try {
    const { url, format = "mp4" } = req.body || {};

    if (!url || !INSTAGRAM_RE.test(url)) {
      return res.status(400).json({ error: "Please send a valid Instagram post or reel link." });
    }
    if (!PROVIDER_URL || !PROVIDER_KEY) {
      return res.status(500).json({ error: "Provider is not configured on the server." });
    }

    const r = await fetch(PROVIDER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PROVIDER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, format }),
    });

    if (!r.ok) {
      return res.status(502).json({ error: "The media provider could not process this link." });
    }

    const data = await r.json();

    // Adjust this field name to match your provider's response
    const downloadUrl = data.media_url || data.url;
    if (!downloadUrl) {
      return res.status(502).json({ error: "No media found for this link." });
    }

    res.json({ downloadUrl, format });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
