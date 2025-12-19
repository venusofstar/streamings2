import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// ================================
// FILE STORAGE
// ================================
const DATA_FILE = path.join(process.cwd(), "streams.json");

// ================================
// MIDDLEWARE
// ================================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ================================
// LOAD STREAMS
// ================================
let streams = {};

if (fs.existsSync(DATA_FILE)) {
  streams = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
} else {
  streams = {
    dzrh: "https://example.com/live/index.m3u8",
    gma: "https://example.com/live/manifest.mpd",
    radio: "https://example.com/radio/index.ts"
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(streams, null, 2));
}

// ================================
// SAVE STREAMS
// ================================
function saveStreams() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(streams, null, 2));
}

// ================================
// UNIVERSAL STREAM REDIRECT
// ================================
app.get("/stream/:id", (req, res) => {
  const id = req.params.id;
  if (!streams[id]) return res.status(404).send("Stream not found");

  const url = streams[id].trim();

  // Set cache headers
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  // Redirect to real stream URL
  res.redirect(url);
});

// ================================
// DASHBOARD UI
// ================================
app.get("/dashboard", (req, res) => {
  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>HONOR TV Dashboard</title>
<style>
body { font-family: Arial; background:#f4f4f4; padding:20px }
li { background:#fff; padding:10px; margin:10px 0; border-radius:6px }
input { padding:6px; width:65% }
button { padding:6px 12px; margin-top:5px; cursor:pointer }
.add { background:#28a745; color:#fff; border:none }
.edit { background:#ffc107; border:none }
.del { background:#dc3545; color:#fff; border:none }
a { text-decoration:none }
</style>
</head>
<body>

<h1>HONOR TV Dashboard</h1>
<ul>
`;

  for (let key in streams) {
    html += `
<li>
<b>${key}</b><br>
<a href="/stream/${key}" target="_blank">▶ Open Stream</a>

<form method="POST" action="/dashboard/edit">
  <input type="hidden" name="id" value="${key}">
  <input type="text" name="url" value="${streams[key]}" required>
  <br>
  <button class="edit">Edit</button>
</form>

<form method="POST" action="/dashboard/delete">
  <input type="hidden" name="id" value="${key}">
  <button class="del">Delete</button>
</form>
</li>
`;
  }

  html += `
</ul>

<h2>Add New Stream</h2>
<form method="POST" action="/dashboard/add">
  <input name="id" placeholder="stream id (ex: gma)" required>
  <br><br>
  <input name="url" placeholder="ANY stream URL (.m3u8/.mpd/.ts)" required>
  <br><br>
  <button class="add">Add Stream</button>
</form>

</body>
</html>
`;

  res.send(html);
});

// ================================
// ADD STREAM
// ================================
app.post("/dashboard/add", (req, res) => {
  let { id, url } = req.body;
  if (!id || !url) return res.send("Invalid input <a href='/dashboard'>Back</a>");

  // sanitize id
  const idSanitized = id.trim().replace(/\s+/g, "_").toLowerCase();
  streams[idSanitized] = url.trim();
  saveStreams();
  res.redirect("/dashboard");
});

// ================================
// EDIT STREAM
// ================================
app.post("/dashboard/edit", (req, res) => {
  const { id, url } = req.body;
  if (!streams[id] || !url) return res.send("Invalid edit <a href='/dashboard'>Back</a>");

  streams[id] = url.trim();
  saveStreams();
  res.redirect("/dashboard");
});

// ================================
// DELETE STREAM
// ================================
app.post("/dashboard/delete", (req, res) => {
  const { id } = req.body;
  if (streams[id]) delete streams[id];
  saveStreams();
  res.redirect("/dashboard");
});

// ================================
// HOME PAGE (HIDDEN LINKS)
// ================================
app.get("/", (req, res) => {
  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>HONOR TV</title>
<style>
body { font-family: Arial; background:#f4f4f4; padding:20px }
li { margin:10px 0; }
button { padding:6px 12px; background:#28a745; color:#fff; border:none; border-radius:4px; cursor:pointer; }
</style>
</head>
<body>

<h2>HONOR TV Streams</h2>
<ul>
`;

  for (let key in streams) {
    // Use JS redirect buttons to hide real URLs
    html += `<li><button onclick="redirect('${key}')">${key}</button></li>`;
  }

  html += `</ul>

<script>
function redirect(id) {
  // Redirect via /stream/:id
  window.location.href = '/stream/' + id;
}
</script>

<br><a href="/dashboard">Open Dashboard</a>
</body>
</html>
`;

  res.send(html);
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`HONOR TV Server running on port ${PORT}`);
});
