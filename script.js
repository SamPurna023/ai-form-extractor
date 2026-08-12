const API_URL = "http://localhost:3000/extract";

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const copyJsonBtn = document.getElementById("copyJsonBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const dropZone = document.getElementById("dropZone");
const previewBox = document.getElementById("previewBox");
const selectedFileWrap = document.getElementById("selectedFileWrap");
const selectedFileName = document.getElementById("selectedFileName");
const message = document.getElementById("message");
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const jsonOutput = document.getElementById("jsonOutput");
const nameValue = document.getElementById("nameValue");
const emailValue = document.getElementById("emailValue");
const phoneValue = document.getElementById("phoneValue");
const dobValue = document.getElementById("dobValue");
const genderValue = document.getElementById("genderValue");
const courseValue = document.getElementById("courseValue");
const yearValue = document.getElementById("yearValue");
const rollNumberValue = document.getElementById("rollNumberValue");

let currentImageUrl = null;
let currentData = null;

function setMessage(text = "", type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function setStatus(visible, text = "Extraction Complete") {
  statusBadge.classList.toggle("hidden", !visible);
  statusText.textContent = text;
}

function normalizeText(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function displayData(data) {
  currentData = data;
  nameValue.textContent = normalizeText(data.name ?? data.fullName ?? data.full_name);
  emailValue.textContent = normalizeText(data.email);
  phoneValue.textContent = normalizeText(data.phone);
  dobValue.textContent = normalizeText(data.dob ?? data.dateOfBirth ?? data.date_of_birth);
  genderValue.textContent = normalizeText(data.gender);
  courseValue.textContent = normalizeText(data.course);
  yearValue.textContent = normalizeText(data.year);
  rollNumberValue.textContent = normalizeText(data["roll number"] ?? data.rollNumber ?? data.roll_number);
  jsonOutput.textContent = JSON.stringify(data, null, 2);
  copyJsonBtn.disabled = false;
  downloadJsonBtn.disabled = false;
  setStatus(true);
}

function resetResults() {
  currentData = null;
  nameValue.textContent = "-";
  emailValue.textContent = "-";
  phoneValue.textContent = "-";
  dobValue.textContent = "-";
  genderValue.textContent = "-";
  courseValue.textContent = "-";
  yearValue.textContent = "-";
  rollNumberValue.textContent = "-";
  jsonOutput.textContent = "{}";
  copyJsonBtn.disabled = true;
  downloadJsonBtn.disabled = true;
  setStatus(false);
}

function clearPreview() {
  if (currentImageUrl) {
    URL.revokeObjectURL(currentImageUrl);
    currentImageUrl = null;
  }

  previewBox.innerHTML = "No preview yet";
  previewBox.classList.add("empty");
  selectedFileWrap.classList.add("hidden");
  selectedFileName.textContent = "";
}

function updateFilePreview(file) {
  clearPreview();

  if (!file) {
    return;
  }

  currentImageUrl = URL.createObjectURL(file);
  previewBox.classList.remove("empty");
  previewBox.innerHTML = `<img src="${currentImageUrl}" alt="Selected form preview">`;
  selectedFileName.textContent = `${file.name} selected`;
  selectedFileWrap.classList.remove("hidden");
}

function getFile() {
  return fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
}

function setFile(file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;
  updateFilePreview(file);
  setMessage("", "");
}

function stripCodeFences(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

async function parseExtractResponse(response) {
  const text = await response.text();
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(cleaned || "The server returned an invalid JSON response.");
  }
}

async function extractData() {
  const file = getFile();

  if (!file) {
    setMessage("Please choose an image before extracting.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Extracting...";
  setMessage("Extracting data from the image...", "");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Extraction failed with status ${response.status}`);
    }

    const data = await parseExtractResponse(response);
    displayData(data);
    setMessage("Extraction completed successfully.", "success");
  } catch (error) {
    console.error(error);
    setMessage(error.message || "Failed to extract data.", "error");
    setStatus(false);
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Extract Data";
  }
}

function clearAll() {
  fileInput.value = "";
  clearPreview();
  resetResults();
  setMessage("", "");
}

fileInput.addEventListener("change", () => {
  const file = getFile();
  updateFilePreview(file);
  if (file) {
    setMessage("", "");
  }
});

uploadBtn.addEventListener("click", extractData);
clearAllBtn.addEventListener("click", clearAll);

copyJsonBtn.addEventListener("click", async () => {
  if (!currentData) {
    return;
  }

  await navigator.clipboard.writeText(JSON.stringify(currentData, null, 2));
  setMessage("JSON copied to clipboard.", "success");
});

downloadJsonBtn.addEventListener("click", () => {
  if (!currentData) {
    return;
  }

  const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "extracted-form-data.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");

  const [file] = event.dataTransfer.files;
  if (file) {
    setFile(file);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    dropZone.classList.remove("dragover");
  }
});

resetResults();