function validateFile(event) {
  event.preventDefault(); // Prevent form submission

  const fileInput = document.getElementById("jsonFile");
  const file = fileInput.files[0]; // Get the uploaded file

  // Check if the file is a JSON file
  if (file && file.type === "application/json") {
    const reader = new FileReader();

    // Read the file content
    reader.onload = function (e) {
      try {
        JSON.parse(e.target.result); // Try to parse the content as JSON
        alert("Valid JSON file");
      } catch (error) {
        alert("Invalid JSON file");
      }
    };

    reader.readAsText(file); // Read the file as text
  } else {
    alert("Please upload a valid JSON file.");
  }
}
