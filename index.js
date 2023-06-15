const fetch = require("node-fetch");
const express = require("express");
const multer = require("multer");
const app = express();
const port = 8080;
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const { createProxyMiddleware } = require("http-proxy-middleware");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

app.listen(port, () => console.log(`Listening on port ${port}`));

const upload = multer().single("jsonFile");

app.post("/test", upload, (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const api_key = req.body["api-key"];
  const vu = req.body.vu;
  const rampUpDuration = req.body.rampUpDuration;
  const domain = req.body.domainURL;
  const apiEndPoint = req.body.apiEndPoint;
  res.json({username, password, api_key, vu, rampUpDuration, domain, apiEndPoint});
  function runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let output = "";

      process.stdout.on("data", (data) => {
        const newData = data.toString();
        output += newData;
        res.write(newData);
      });

      process.stderr.on("data", (data) => {
        const errorData = data.toString();
        console.error(errorData);
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }
  const fileContent = req.file.buffer.toString();
  // console.log("done")
  // Read the uploaded JSON file as a string
  // Parse the uploaded JSON file content as an object
  // const jsonData = JSON.parse(fileContent);
  // for (let i = 0; i < jsonData.length; i++) {
  //   console.log(jsonData[i]);
  // }
  //Run the k6 script with the uploaded JSON data as an environment variable
  // console.log(fileContent)
  runCommand("./k6", [
    "run",
    "--out",
    "dashboard",
    "--env",
    `USERNAME=${username}`,
    "--env",
    `PASSWORD=${password}`,
    "--env",
    `APIKEY=${api_key}`,
    "--env",
    `DOMAIN=${domain}`,
    "--env",
    `RAMPUPDURATION=${rampUpDuration}`,
    "--env",
    `VU=${vu}`,
    "--env",
    `JSONDATA=${fileContent}`,
    "script.js",
  ])
    .then((output) => {
      console.log("Command completed successfully.");
      // res.send(output); // Send output as response
      res.end();
    })
    .catch((error) => {
      console.error("An error occurred while running the command:", error);
      res.status(500).send(error.message); // Send error message as response
    });
});

app.use(
  "/db",
  createProxyMiddleware({
    target: "http://127.0.0.1:5665/ui/?endpoint=/",
    changeOrigin: true,
    // pathRewrite: {
    //   [`^/`]: "",
    // },
  })
);

app.use(
  "/",
  createProxyMiddleware({
    target: "http://127.0.0.1:5665/ui/",
    changeOrigin: true,
    // pathRewrite: {
    //   [`^/`]: "",
    // },
  })
);

// app.get("/db", (req, res) => {
//   console.log("hi")
//   fetch("http://127.0.0.1:5665/ui/?endpoint=/").then((r) => {
//     // console.log(r)
//     return r.text()
//   }).then(d => { console.log(d); res.send(d);});
// });
