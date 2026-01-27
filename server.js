const express = require('express');
const request = require('request');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

/* ================= STREAM MAP (SERVER ONLY) ================= */
const streams = {
  thekingdom:
    'https://tevh.9ljp.com/vod/1/2026/01/24/6d34af1ff298/index5.m3u8?wsSecret=5cb7a607a15beb210224810e76db31b4&wsTime=69783c86',

  love_stories_tv:
    'https://84e619480232400a842ce499d053458a.mediatailor.us-east-1.amazonaws.com/v1/manifest/04fd913bb278d8775298c26fdca9d9841f37601f/ONO_LoveStoriesTV/f512431a-8ffb-4a80-b8a4-e06c99400c29/3.m3u8',

  UNTOLD_2025:
    'https://tevh.9ljp.com/vod/1/2025/08/01/bd4120b363da/index5.m3u8?wsSecret=6e520070865cdb80edac26888b4fb7d9&wsTime=688e0ebd'
};

/* ================= M3U8 PROXY ================= */
app.get('/:stream/vod.m3u8', (req, res) => {
  const key = req.params.stream;
  const streamUrl = streams[key];

  if (!streamUrl) return res.status(404).send('Invalid stream');

  const base = new URL(streamUrl);
  const basePath = base.href.substring(0, base.href.lastIndexOf('/') + 1);

  request.get(streamUrl, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(502).send('Playlist error');
    }

    // Rewrite segment URLs → hidden proxy
    const rewritten = body.replace(/^(?!#)(.+)$/gm, line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return line;

      const full = new URL(line, basePath).href;
      return `/segment.ts?u=${Buffer.from(full).toString('base64')}`;
    });

    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-store'
    });

    res.send(rewritten);
  });
});

/* ================= SEGMENT PROXY ================= */
app.get('/segment.ts', (req, res) => {
  if (!req.query.u) return res.sendStatus(400);

  const segmentUrl = Buffer
    .from(req.query.u, 'base64')
    .toString('utf8');

  request
    .get(segmentUrl)
    .on('response', r => {
      res.set({
        'Content-Type': 'video/mp2t',
        'Cache-Control': 'no-store'
      });
    })
    .on('error', () => res.sendStatus(502))
    .pipe(res);
});

/* ================= HOME ================= */
app.get('/', (req, res) => {
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
    <p><small>@2025</small></p>
  </div>
</body>
</html>
`);
});

/* ================= START ================= */
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
