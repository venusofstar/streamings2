import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Load links
const DATA_FILE = path.join(process.cwd(), "links.json");
let links = {};
if (fs.existsSync(DATA_FILE)) {
  links = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// Redirect short link
app.get("/:key/manifest.mpd", (req, res) => {
  const { key } = req.params;
  const url = links[key];
  if (url) {
    res.redirect(url);
  } else {
    res.status(404).send("Link not found");
  }
});

// Optional: health check
app.get("/", (req, res) => res.send("Shortlink server is running"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
