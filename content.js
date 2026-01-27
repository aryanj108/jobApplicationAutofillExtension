// Content script for autofill
console.log("Autofill content script loaded");

chrome.storage.sync.get("profile", ({ profile }) => {
  if (!profile) {
    console.log("No profile found");
    return;
  }

  console.log("Autofilling with profile:", profile);

  const inputs = document.querySelectorAll("input, textarea");
  const selects = document.querySelectorAll("select");

  // Helper: get label text from multiple sources
  const getLabelText = (el) => {
    let labelText = "";
    
    // Check for associated label
    if (el.labels && el.labels.length > 0) {
      labelText = el.labels[0].innerText;
    }
    
    // Check for aria-label
    if (!labelText && el.getAttribute("aria-label")) {
      labelText = el.getAttribute("aria-label");
    }
    
    // Check for placeholder
    if (!labelText && el.placeholder) {
      labelText = el.placeholder;
    }
    
    // Check for name attribute
    if (!labelText && el.name) {
      labelText = el.name;
    }
    
    // Check for id attribute
    if (!labelText && el.id) {
      labelText = el.id;
    }
    
    // Check parent for label-like text
    if (!labelText && el.parentElement) {
      const parentText = el.parentElement.innerText;
      if (parentText && parentText.length < 100) {
        labelText = parentText;
      }
    }
    
    return labelText.toLowerCase();
  };

  // Helper: set input value (React-safe)
  const setInputValue = (input, value, pressEnter = false) => {
    if (!value) return;
    
    try {
      // Native setter to bypass React
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      ).set;
      
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      ).set;
      
      if (input.tagName === "TEXTAREA" && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(input, value);
      } else if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, value);
      } else {
        input.value = value;
      }
      
      // Trigger events for React and other frameworks
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      
      // Press Enter for autocomplete fields (like school, company, etc.)
      if (pressEnter) {
        setTimeout(() => {
          const enterEvent = new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          input.dispatchEvent(enterEvent);
          
          // Also trigger keyup
          const enterEventUp = new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          input.dispatchEvent(enterEventUp);
          
          console.log(`Pressed Enter on ${input.name || input.id || 'input'}`);
        }, 150); // Small delay to let autocomplete appear
      }
      
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      
      console.log(`Filled ${input.name || input.id || 'input'} with: ${value}`);
    } catch (error) {
      console.error("Error setting input value:", error);
      input.value = value;
    }
  };

  // Helper: fill dropdown
  const fillSelect = (select, value) => {
    if (!value) return;
    
    try {
      const valueStr = value.toString().toLowerCase();
      
      // Try exact match first
      let option = [...select.options].find(
        (o) => o.value.toLowerCase() === valueStr || o.text.toLowerCase() === valueStr
      );
      
      // Try partial match
      if (!option) {
        option = [...select.options].find(
          (o) => o.text.toLowerCase().includes(valueStr) || o.value.toLowerCase().includes(valueStr)
        );
      }
      
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("blur", { bubbles: true }));
        console.log(`Selected ${option.text} in ${select.name || select.id || 'select'}`);
      }
    } catch (error) {
      console.error("Error setting select value:", error);
    }
  };

  // Helper: fill radio buttons
  const fillRadio = (label, value) => {
    if (!value) return;
    
    try {
      const valueStr = value.toString().toLowerCase();
      const radios = document.querySelectorAll(`input[type="radio"]`);
      
      for (const radio of radios) {
        const radioLabel = getLabelText(radio);
        if (radioLabel.includes(label.toLowerCase()) && 
            (radio.value.toLowerCase().includes(valueStr) || radioLabel.includes(valueStr))) {
          radio.click();
          console.log(`Clicked radio: ${radio.value}`);
          break;
        }
      }
    } catch (error) {
      console.error("Error setting radio value:", error);
    }
  };

  // --- Fill text inputs and textareas ---
  inputs.forEach((input) => {
    // Skip file inputs, hidden inputs, and buttons
    if (input.type === "file" || input.type === "hidden" || 
        input.type === "submit" || input.type === "button") {
      return;
    }
    
    const label = getLabelText(input);
    console.log(`Checking input with label: ${label}`);

    // Personal
    if (label.includes("first") && label.includes("name") && !label.includes("last") && !label.includes("preferred")) {
      setInputValue(input, profile.personal.firstName || "");
    } else if (label.includes("last") && label.includes("name")) {
      setInputValue(input, profile.personal.lastName || "");
    } else if (label.includes("preferred") || label.includes("nickname")) {
      setInputValue(input, profile.personal.preferredFirstName || "");
    } else if (label.includes("email") || label.includes("e-mail")) {
      setInputValue(input, profile.personal.email || "");
    } else if (label.includes("phone") || label.includes("mobile") || label.includes("telephone")) {
      setInputValue(input, profile.personal.phone || "");
    }
    // Location
    else if (label.includes("address") && !label.includes("email")) {
      setInputValue(input, profile.location.address || "");
    } else if (label.includes("city")) {
      setInputValue(input, profile.location.city || "");
    } else if (label.includes("county")) {
      setInputValue(input, profile.location.county || "");
    } else if (label.includes("zip") || label.includes("postal")) {
      setInputValue(input, profile.location.zipcode || "");
    } else if (label.includes("country")) {
      setInputValue(input, profile.location.country || "");
    }
    // Education
    else if (label.includes("school") || label.includes("university") || label.includes("college") || label.includes("institution")) {
      setInputValue(input, profile.education.school || "", true); // Press Enter for autocomplete
    } else if (label.includes("degree") || label.includes("major") || label.includes("field of study")) {
      setInputValue(input, profile.education.degree || "");
    }
    // Links
    else if (label.includes("linkedin")) {
      setInputValue(input, profile.links.linkedin || "");
    } else if (label.includes("website") || label.includes("portfolio") || label.includes("personal site") || label.includes("url")) {
      setInputValue(input, profile.links.website || "");
    }
    // Referral source / How did you hear
    else if (label.includes("hear about") || label.includes("referral") || label.includes("how did you")) {
      setInputValue(input, profile.workAuth.referralSource || "");
    }
    // Office preference / willing to work in office
    else if (label.includes("office") && (label.includes("willing") || label.includes("work"))) {
      setInputValue(input, profile.workAuth.officePreference || "");
    }
  });

  // --- Fill dropdowns ---
  selects.forEach((select) => {
    const label = getLabelText(select);
    console.log(`Checking select with label: ${label}`);

    // Education graduation year (expected graduation)
    if ((label.includes("graduation") || label.includes("expected")) && label.includes("year")) {
      fillSelect(select, profile.education.graduationYear || profile.education.endYear || "");
    }
    // Education end date
    else if (label.includes("end") && label.includes("month")) {
      fillSelect(select, profile.education.endMonth || "");
    } else if (label.includes("graduation") && label.includes("month")) {
      fillSelect(select, profile.education.endMonth || "");
    } else if (label.includes("end") && label.includes("year")) {
      fillSelect(select, profile.education.endYear || "");
    }
    // EEO / demographics
    else if (label.includes("gender") || label.includes("sex")) {
      fillSelect(select, profile.eeo.gender || "");
    } else if (label.includes("hispanic") || label.includes("latino") || label.includes("latina")) {
      fillSelect(select, profile.eeo.hispanicLatino || "");
    } else if (label.includes("race") || label.includes("ethnicity")) {
      fillSelect(select, profile.eeo.race || "");
    } else if (label.includes("veteran")) {
      fillSelect(select, profile.eeo.veteranStatus || "");
    } else if (label.includes("disability") || label.includes("disabled")) {
      fillSelect(select, profile.eeo.disabilityStatus || "");
    }
    // Work authorization
    else if (label.includes("legally authorized") || label.includes("legal authorization")) {
      fillSelect(select, profile.workAuth.legallyAuthorized || "");
    } else if (label.includes("sponsorship") || label.includes("visa")) {
      fillSelect(select, profile.workAuth.sponsorshipRequired || "");
    }
  });

  // --- Fill radio buttons for sponsorship and work auth ---
  if (profile.workAuth.legallyAuthorized) {
    fillRadio("legally authorized", profile.workAuth.legallyAuthorized);
    fillRadio("legal authorization", profile.workAuth.legallyAuthorized);
  }
  
  if (profile.workAuth.sponsorshipRequired) {
    fillRadio("sponsorship", profile.workAuth.sponsorshipRequired);
    fillRadio("visa", profile.workAuth.sponsorshipRequired);
  }

  // --- Highlight resume upload field ---
  setTimeout(() => {
    const fileInput = document.querySelector("input[type=file]");
    if (fileInput) {
      fileInput.scrollIntoView({ behavior: "smooth", block: "center" });
      fileInput.style.outline = "3px solid #ff6b6b";
      fileInput.style.outlineOffset = "2px";
      
      // Remove highlight after 5 seconds
      setTimeout(() => {
        fileInput.style.outline = "";
        fileInput.style.outlineOffset = "";
      }, 5000);
    }
  }, 500);

  console.log("Autofill complete!");
});