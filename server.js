const express = require('express');
const request = require('request');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// ✅ Stream channel map (key: name, value: m3u8 URL)
const streams = {
  
  thekingdom: 'https://tevh.9ljp.com/vod/1/2026/01/24/6d34af1ff298/index5.m3u8?wsSecret=5cb7a607a15beb210224810e76db31b4&wsTime=69783c86',
  
love_stories_tv: 'https://84e619480232400a842ce499d053458a.mediatailor.us-east-1.amazonaws.com/v1/manifest/04fd913bb278d8775298c26fdca9d9841f37601f/ONO_LoveStoriesTV/f512431a-8ffb-4a80-b8a4-e06c99400c29/3.m3u8',
  UNTOLD_2025: "https://tevh.9ljp.com/vod/1/2025/08/01/bd4120b363da/index5.m3u8?wsSecret=6e520070865cdb80edac26888b4fb7d9&wsTime=688e0ebd"

};

// 🎬 Proxy for .m3u8 playlist
app.get('/:stream/vod.m3u8', (req, res) => {
  const key = req.params.stream;
  const streamUrl = streams[key];

  if (!streamUrl) return res.status(404).send('❌ Invalid stream key');

  const baseUrl = new URL(streamUrl);
  const basePath = baseUrl.href.substring(0, baseUrl.href.lastIndexOf('/') + 1);

  request.get(streamUrl, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(502).send('❌ Failed to fetch playlist');
    }

    const modified = body.replace(/^(?!#)(.+)$/gm, (line) => {
      line = line.trim();
      if (!line || line.startsWith('#')) return line;
      const fullUrl = new URL(line, basePath).href;
      return `/segment.ts?url=${encodeURIComponent(fullUrl)}`;
    });

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(modified);
  });
});

// 🎥 Proxy for .ts segments
app.get('/segment.ts', (req, res) => {
  const segmentUrl = req.query.url;
  if (!segmentUrl) return res.status(400).send('❌ No segment URL');

  request
    .get(segmentUrl)
    .on('response', (r) => res.set(r.headers))
    .on('error', () => res.status(502).send('❌ Segment failed'))
    .pipe(res);
});

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>HONOR TV PH</title>
    <style>
      body{
        margin:0;height:100vh;display:flex;justify-content:center;align-items:center;
        background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);
        font-family:Arial;color:#fff;text-align:center
      }
      .box{
        background:rgba(0,0,0,.45);padding:30px 40px;border-radius:16px;
        box-shadow:0 10px 30px rgba(0,0,0,.5);max-width:420px
      }
      h1{color:#00e5ff;margin:0}
    </style>
  </head>
  <body>
    <div class="box">
      <h1>📺 HONOR TV PH</h1>
      <p>Enjoy Watching Movies</p>
    </div>
  </body>
  </html>
  `);
});

// 🚀 Launch the server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});






