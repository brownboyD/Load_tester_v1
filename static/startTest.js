const username = document.querySelector("#username");
const password = document.querySelector("#password");
const api_key = document.querySelector("#api-key");
const domain = document.querySelector("#domainURL");
// const endPoint = document.querySelector("#apiEndPoint");
const rampUpDuration = document.querySelector("#rampUpDuration");
const vu = document.querySelector("#vu");
const fileContent = document.querySelector("#jsonFile");

async function startTest(e) {
    e.preventDefault(); // Prevent form submission
    console.log("startTest");
    const body = new FormData();
    body.append("username", username.value);
    body.append("password", password.value);
    body.append("api-key", api_key.value);
    body.append("domainURL", domain.value);
    // body.append("apiEndPoint", endPoint.value);
    body.append("rampUpDuration", rampUpDuration.value);
    body.append("vu", vu.value);
    body.append("jsonFile", fileContent.files[0]);
    const requestOptions = {
      method: "POST",
    //   headers: { "Content-Type": "multipart/form-data" },
      body: body,
    };

    const data = await fetch("http://127.0.0.1:8080/test", requestOptions);

    const result = await data.json();
    console.log(result);
}

document.querySelector(".test").addEventListener("click", startTest)