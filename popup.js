// Helper function to show status messages
function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type} show`;
  
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

// --- Load saved profile when popup opens ---
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get("profile", ({ profile }) => {
    if (!profile) {
      console.log("No profile found, using defaults");
      return;
    }

    console.log("Loaded profile:", profile);

    // Ensure default objects exist
    profile.personal = profile.personal || {};
    profile.location = profile.location || {};
    profile.education = profile.education || {};
    profile.links = profile.links || {};
    profile.workAuth = profile.workAuth || {};
    profile.eeo = profile.eeo || {};

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
    document.getElementById("graduationYear").value = profile.education.graduationYear || "";
    document.getElementById("endMonth").value = profile.education.endMonth || "";
    document.getElementById("endYear").value = profile.education.endYear || "";

    // LINKS
    document.getElementById("linkedin").value = profile.links.linkedin || "";
    document.getElementById("website").value = profile.links.website || "";

    // WORK AUTHORIZATION
    document.getElementById("legallyAuthorized").value = profile.workAuth.legallyAuthorized || "";
    document.getElementById("sponsorshipRequired").value = profile.workAuth.sponsorshipRequired || "";
    document.getElementById("referralSource").value = profile.workAuth.referralSource || "";
    document.getElementById("officePreference").value = profile.workAuth.officePreference || "";

    // EEO / Voluntary Self-ID
    document.getElementById("gender").value = profile.eeo.gender || "";
    document.getElementById("hispanicLatino").value = profile.eeo.hispanicLatino || "";
    document.getElementById("race").value = profile.eeo.race || "";
    document.getElementById("veteranStatus").value = profile.eeo.veteranStatus || "";
    document.getElementById("disabilityStatus").value = profile.eeo.disabilityStatus || "";
  });
});

// --- Save profile ---
document.getElementById("save").addEventListener("click", () => {
  try {
    // Build profile object from current form values
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
        graduationYear: document.getElementById("graduationYear").value,
        endMonth: document.getElementById("endMonth").value,
        endYear: document.getElementById("endYear").value
      },
      links: {
        linkedin: document.getElementById("linkedin").value,
        website: document.getElementById("website").value
      },
      workAuth: {
        legallyAuthorized: document.getElementById("legallyAuthorized").value,
        sponsorshipRequired: document.getElementById("sponsorshipRequired").value,
        referralSource: document.getElementById("referralSource").value,
        officePreference: document.getElementById("officePreference").value
      },
      eeo: {
        gender: document.getElementById("gender").value,
        hispanicLatino: document.getElementById("hispanicLatino").value,
        race: document.getElementById("race").value,
        veteranStatus: document.getElementById("veteranStatus").value,
        disabilityStatus: document.getElementById("disabilityStatus").value
      }
    };

    console.log("Saving profile:", profile);

    // Save to chrome storage
    chrome.storage.sync.set({ profile }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving profile:", chrome.runtime.lastError);
        showStatus("Error saving profile!", "error");
      } else {
        console.log("Profile saved successfully!");
        showStatus("✓ Profile saved successfully!", "success");
      }
    });
  } catch (error) {
    console.error("Exception saving profile:", error);
    showStatus("Error saving profile!", "error");
  }
});

// --- Run autofill on current tab ---
document.getElementById("fill").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      showStatus("No active tab found!", "error");
      return;
    }

    // Check if we have a profile saved
    chrome.storage.sync.get("profile", async ({ profile }) => {
      if (!profile || !profile.personal || !profile.personal.firstName) {
        showStatus("Please save your profile first!", "error");
        return;
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        showStatus("✓ Autofill complete!", "success");
      } catch (error) {
        console.error("Error executing content script:", error);
        showStatus("Error autofilling page. Try reloading the page.", "error");
      }
    });
  } catch (error) {
    console.error("Exception during autofill:", error);
    showStatus("Error autofilling page!", "error");
  }
});