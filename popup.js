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

document.getElementById("save").onclick = () => {
  const profile = {
    personal: {
      firstName: firstName.value,
      lastName: lastName.value,
      preferredFirstName: preferredFirstName.value,
      email: email.value,
      phone: phone.value
    },
    location: {
      address: address.value,
      city: city.value,
      county: county.value,
      zipcode: zipcode.value,
      country: country.value
    }
  };

  chrome.storage.sync.set({ profile });
};

