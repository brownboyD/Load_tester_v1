async function abortTest(e) {
  e.preventDefault(); // Prevent form submission
  console.log("AbortTest");
  const body = new FormData();
  const requestOptions = {
    method: "POST",
    //   headers: { "Content-Type": "multipart/form-data" },
    body: body,
  };

  const data = await fetch("http://127.0.0.1:8080/abort", requestOptions);

  const result = await data.json();
  console.log(result);
}

document.querySelector(".abort").addEventListener("click", abortTest);
