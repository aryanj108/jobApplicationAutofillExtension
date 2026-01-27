const fields = ["fullName", "email", "linkedin", "github"];

// Load saved data when popup opens
chrome.storage.sync.get(fields, (data) => {
  fields.forEach(field => {
    if (data[field]) {
      document.getElementById(field).value = data[field];
    }
  });
});

// Save user data
document.getElementById("save").addEventListener("click", () => {
  const data = {};
  fields.forEach(field => {
    data[field] = document.getElementById(field).value;
  });

  chrome.storage.sync.set(data, () => {
    alert("Saved!");
  });
});

// Run autofill on current tab
document.getElementById("fill").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});
