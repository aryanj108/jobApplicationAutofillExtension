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
    document.getElementById("state").value = profile.location.state || "";
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
    document.getElementById("futureSponsorshipRequired").value = profile.workAuth.futureSponsorshipRequired || "";
    document.getElementById("workAuthorizationType").value = profile.workAuth.workAuthorizationType || "";
    document.getElementById("referralSource").value = profile.workAuth.referralSource || "";
    document.getElementById("officePreference").value = profile.workAuth.officePreference || "";
    document.getElementById("currentLocation").value = profile.workAuth.currentLocation || "";
    document.getElementById("availableStartDate").value = profile.workAuth.availableStartDate || "";

    // WORK EXPERIENCE
    document.getElementById("jobTitle").value = profile.workExperience?.jobTitle || "";
    document.getElementById("company").value = profile.workExperience?.company || "";
    document.getElementById("workLocation").value = profile.workExperience?.workLocation || "";
    document.getElementById("workStartDate").value = profile.workExperience?.workStartDate || "";
    document.getElementById("workEndDate").value = profile.workExperience?.workEndDate || "";

    // ADDITIONAL QUESTIONS
    document.getElementById("age18OrOlder").value = profile.additionalQuestions?.age18OrOlder || "";
    document.getElementById("hasHighSchoolDiploma").value = profile.additionalQuestions?.hasHighSchoolDiploma || "";
    document.getElementById("currentlyEnrolled").value = profile.additionalQuestions?.currentlyEnrolled || "";
    document.getElementById("returningToSchool").value = profile.additionalQuestions?.returningToSchool || "";
    document.getElementById("isCoopProgram").value = profile.additionalQuestions?.isCoopProgram || "";
    document.getElementById("priorInternships").value = profile.additionalQuestions?.priorInternships || "";
    document.getElementById("hasRelativesAtCompany").value = profile.additionalQuestions?.hasRelativesAtCompany || "";
    document.getElementById("previouslyApplied").value = profile.additionalQuestions?.previouslyApplied || "";
    document.getElementById("hasNonCompete").value = profile.additionalQuestions?.hasNonCompete || "";

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
        state: document.getElementById("state").value,
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
        futureSponsorshipRequired: document.getElementById("futureSponsorshipRequired").value,
        workAuthorizationType: document.getElementById("workAuthorizationType").value,
        referralSource: document.getElementById("referralSource").value,
        officePreference: document.getElementById("officePreference").value,
        currentLocation: document.getElementById("currentLocation").value,
        availableStartDate: document.getElementById("availableStartDate").value
      },
      workExperience: {
        jobTitle: document.getElementById("jobTitle").value,
        company: document.getElementById("company").value,
        workLocation: document.getElementById("workLocation").value,
        workStartDate: document.getElementById("workStartDate").value,
        workEndDate: document.getElementById("workEndDate").value
      },
      additionalQuestions: {
        age18OrOlder: document.getElementById("age18OrOlder").value,
        hasHighSchoolDiploma: document.getElementById("hasHighSchoolDiploma").value,
        currentlyEnrolled: document.getElementById("currentlyEnrolled").value,
        returningToSchool: document.getElementById("returningToSchool").value,
        isCoopProgram: document.getElementById("isCoopProgram").value,
        priorInternships: document.getElementById("priorInternships").value,
        hasRelativesAtCompany: document.getElementById("hasRelativesAtCompany").value,
        previouslyApplied: document.getElementById("previouslyApplied").value,
        hasNonCompete: document.getElementById("hasNonCompete").value
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