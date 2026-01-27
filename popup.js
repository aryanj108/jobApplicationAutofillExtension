// Load saved data when popup opens
chrome.storage.sync.get("profile", ({ profile }) => {
  if (!profile) return;

  // PERSONAL
  document.getElementById("firstName").value = profile.personal.firstName || "";
  document.getElementById("lastName").value = profile.personal.lastName || "";
  document.getElementById("preferredFirstName").value = profile.personal.preferredFirstName || "";
  document.getElementById("email").value = profile.personal.email || "";
  document.getElementById("phone").value = profile.personal.phone || "";

  // LOCATION
  document.getElementById("address").value = profile.location.address || "";
  document.getElementById("city").value = profile.location.city || "";
  document.getElementById("county").value = profile.location.county || "";
  document.getElementById("zipcode").value = profile.location.zipcode || "";
  document.getElementById("country").value = profile.location.country || "";

  // EDUCATION
  document.getElementById("school").value = profile.education.school || "";
  document.getElementById("degree").value = profile.education.degree || "";

  // LINKS
  document.getElementById("linkedin").value = profile.links.linkedin || "";
  document.getElementById("website").value = profile.links.website || "";
});

// Save user data
document.getElementById("save").addEventListener("click", () => {
  const profile = {
    personal: {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      preferredFirstName: document.getElementById("preferredFirstName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value
    },
    location: {
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      county: document.getElementById("county").value,
      zipcode: document.getElementById("zipcode").value,
      country: document.getElementById("country").value
    },
    education: {
      school: document.getElementById("school").value,
      degree: document.getElementById("degree").value
    },
    links: {
      linkedin: document.getElementById("linkedin").value,
      website: document.getElementById("website").value
    }
  };

  chrome.storage.sync.set({ profile }, () => {
    alert("Profile saved!");
    console.log("Saved profile:", profile);
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
