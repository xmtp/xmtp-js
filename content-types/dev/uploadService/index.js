const fs = require("fs");
const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

const key = fs.readFileSync("key.pem", "utf-8");
const cert = fs.readFileSync("cert.pem", "utf-8");

const UPLOADS = {};

app.use(bodyParser.raw({ type: "application/octet-stream" }));

app.get("/:path", (req, res) => {
  const path = req.params.path;
  console.log(`GET /${path}`);
  const file = UPLOADS[path];
  if (file) {
    res.header("Content-Type", "application/octet-stream");
    res.send(file);
  } else {
    console.log(`Upload path found: ${path}`);
  }
});

app.post("/:path", (req, res) => {
  const path = req.params.path;
  console.log(`POST /${path}`);
  UPLOADS[path] = req.body;
  res.sendStatus(200);
});

https.createServer({ key, cert }, app).listen(port, () => {
  console.log(`Upload service listening on port ${port}`);
});
