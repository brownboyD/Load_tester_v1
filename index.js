const fetch = require("node-fetch");
const express = require("express");
const multer = require("multer");
const app = express();
const port = 8080;
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const { exec } = require("child_process");
const { createProxyMiddleware } = require("http-proxy-middleware");
const upload = multer().single("jsonFile");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

app.listen(port, () => console.log(`Listening on port ${port}`));

//FUNCTIONS
//function to run the k6 command
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let output = "";

    process.stdout.on("data", (data) => {
      const newData = data.toString();
      output += newData;
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

// function to check if the target server is reachable
async function isTargetServerReachable() {
  try {
    const response = await fetch("http://127.0.0.1:5665/ui/");
    return response.ok;
  } catch (error) {
    return false;
  }
}

// function to handle proxy middleware
function handleProxyMiddleware(target) {
  return async (req, res, next) => {
    const isReachable = await isTargetServerReachable();
    if (!isReachable) {
      res.redirect("/");
      return;
    }
    next();
  };
}

// ROUTES
app.post("/test", upload, (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const api_key = req.body["api-key"];
  const vu = req.body.vu;
  const rampUpDuration = req.body.rampUpDuration;
  const steadyStateDuration = req.body.steadyStateDuration;
  const domain = req.body.domainURL;
  console.log(steadyStateDuration);
  console.log(rampUpDuration);
  res.json({ username, password, api_key, vu, rampUpDuration,steadyStateDuration, domain });
  const fileContent = req.file.buffer.toString();
  // Read the uploaded JSON file as a string
  // Parse the uploaded JSON file content as an object
  // const jsonData = JSON.parse(fileContent);
  // for (let i = 0; i < jsonData.length; i++) {
  //   console.log(jsonData[i]);
  // }
  //Run the k6 script with the uploaded JSON data as an environment variable
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
    `STEADYSTATEDURATION=${steadyStateDuration}`,
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
      // res.status(500).send(error.message); // Send error message as response
      res.end();
    });
});

app.post("/abort", (req, res) => {
  const command = process.platform === "win32" ? "taskkill /IM k6.exe /F" : "pkill -f k6";
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`k6 script stopped successfully.`);
  });
  res.end();
});



// PROXY
app.use(
  "/db",
  handleProxyMiddleware("http://127.0.0.1:5665/ui/?endpoint=/"),
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
  handleProxyMiddleware("http://127.0.0.1:5665/ui/"),
  createProxyMiddleware({
    target: "http://127.0.0.1:5665/ui/",
    changeOrigin: true,
    // pathRewrite: {
    //   [`^/`]: "",
    // },
  })
);

