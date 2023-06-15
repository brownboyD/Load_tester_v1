import http from "k6/http";
import { sleep, check } from "k6";

export let options = {
  stages: [
    { duration: `${__ENV.RAMPUPDURATION}m`, target: Number(__ENV.VU) }, // Ramp up to n virtual users over t minute
    { duration: "0.1m", target: Number(__ENV.VU) }, // Stay at n virtual users for t minutes
    { duration: `${__ENV.RAMPUPDURATION}m`, target: Number(__ENV.VU) }, // Ramp down to 0 virtual users over t minute
  ],
  thresholds: {
    http_req_duration: ["p(95)<500000"], // Set a response time threshold of 500ms for 95% of requests
  },
};

export function setup() {
  let payload = JSON.stringify({
    ms_request: {
      user: {
        username: __ENV.USERNAME,
        password: __ENV.PASSWORD,
        api_key: __ENV.APIKEY,
      },
    },
  });

  console.log("Performing user authorization...");

  let authResponse = http.post(`${__ENV.DOMAIN}/api/login.json`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  // console.log("Authorization response:", authResponse.body);
  const authToken = JSON.parse(authResponse.body)["ms_response"]["user"][
    "_token"
  ];
  console.log("AUTH token:", authToken);
  return {
    authToken,
  };
}

export default function (data) {
  // Use the access token from the context object for subsequent API requests
  // console.log("Performing get requests ");
  let headers = {
    Cookie: `_felix_session_id=${data.authToken}`,
  };
  const jsonData = JSON.parse(__ENV.JSONDATA);
  for (let i = 0; i < jsonData.length; i++) {
    let request = jsonData[i];
    let { method, apiEndPoint, payload } = request;
    let response;
    switch (method) {
      case "GET":
        response = http.get(`${__ENV.DOMAIN}${apiEndPoint}`, { headers });
        break;
      case "POST":
        let postPayload = JSON.stringify(payload);
        response = http.post(`${__ENV.DOMAIN}${apiEndPoint}`, postPayload, {
          headers,
        });
        break;
      case "PUT":
        let putPayload = JSON.stringify(payload);
        response = http.post(`${__ENV.DOMAIN}${apiEndPoint}`, putPayload, {
          headers,
        });
        break;
      case "DELETE":
        response = http.del(`${__ENV.DOMAIN}${apiEndPoint}`, null, { headers });
        break;
      default:
        console.log(`Unsupported request method: ${method}`);
        continue;
    }
    // console.log("Response:", response.body);
    // console.log("Response:", response.status);
    // If the response is unauthorized (401), reauthorize and retrieve a new access token
    if (response.status === 401) {
      console.log("Invalid credentials");
    }

    check(response, {
      "is status 200": (r) => r.status === 200,
      "is response time < 500ms": (r) => r.timings.duration < 500,
    });

    sleep(1); // Wait for 1 second before making the next request
  }
}

// ./k6 run --out dashboard --env USERNAME=tusharsingh20112001@gmail.com --env PASSWORD=U2Ftc2hlcjFAMg== --env APIKEY=a1c55fc5f4f5ede3921bc49118d6d752aa78b2a0 /src/script.js
