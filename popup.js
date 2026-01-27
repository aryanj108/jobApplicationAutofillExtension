// Load saved profile when popup opens
chrome.storage.sync.get("profile", ({ profile }) => {
  if (!profile) return;

  // Personal
  document.getElementById("firstName").value = profile.personal.firstName || "";
  document.getElementById("lastName").value = profile.personal.lastName || "";
  document.getElementById("preferredFirstName").value = profile.personal.preferredFirstName || "";
  document.getElementById("email").value = profile.personal.email || "";
  document.getElementById("phone").value = profile.personal.phone || "";

  // Location
  document.getElementById("address").value = profile.location.address || "";
  document.getElementById("city").value = profile.location.city || "";
  document.getElementById("county").value = profile.location.county || "";
  document.getElementById("zipcode").value = profile.location.zipcode || "";
  document.getElementById("country").value = profile.location.country || "";

  // Education
  document.getElementById("school").value = profile.education.school || "";
  document.getElementById("degree").value = profile.education.degree || "";
  document.getElementById("endMonth").value = profile.education.endMonth || "";
  document.getElementById("endYear").value = profile.education.endYear || "";

  // Links
  document.getElementById("linkedin").value = profile.links.linkedin || "";
  document.getElementById("website").value = profile.links.website || "";

  // Work Authorization
  document.getElementById("sponsorshipRequired").value = profile.workAuth.sponsorshipRequired || "";

  // Voluntary Self-ID / EEO
  document.getElementById("gender").value = profile.eeo.gender || "";
  document.getElementById("hispanicLatino").value = profile.eeo.hispanicLatino || "";
  document.getElementById("race").value = profile.eeo.race || "";
  document.getElementById("veteranStatus").value = profile.eeo.veteranStatus || "";
  document.getElementById("disabilityStatus").value = profile.eeo.disabilityStatus || "";
});

// Save profile
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
      degree: document.getElementById("degree").value,
      endMonth: document.getElementById("endMonth").value,
      endYear: document.getElementById("endYear").value
    },
    links: {
      linkedin: document.getElementById("linkedin").value,
      website: document.getElementById("website").value
    },
    workAuth: {
      sponsorshipRequired: document.getElementById("sponsorshipRequired").value
    },
    eeo: {
      gender: document.getElementById("gender").value,
      hispanicLatino: document.getElementById("hispanicLatino").value,
      race: document.getElementById("race").value,
      veteranStatus: document.getElementById("veteranStatus").value,
      disabilityStatus: document.getElementById("disabilityStatus").value
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
