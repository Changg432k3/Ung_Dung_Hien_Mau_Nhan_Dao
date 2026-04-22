import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const title = $('title').text() || $('meta[property="og:title"]').attr('content');
      const coverImage = $('meta[property="og:image"]').attr('content');
      const content = $('meta[property="og:description"]').attr('content');

      res.json({ title, coverImage, content });
    } catch (error) {
      res.status(500).json({ error: "Failed to scrape URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
