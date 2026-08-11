const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("http://localhost:3000/extract", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log(data);
});