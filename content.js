// Content script for autofill
console.log("Autofill content script loaded");

// Set up mutation observer to watch for autocomplete dropdowns
let autocompleteClickAttempts = 0;
const maxAutocompleteAttempts = 3;

const observer = new MutationObserver((mutations) => {
  if (autocompleteClickAttempts >= maxAutocompleteAttempts) {
    return;
  }
  
  // Look for autocomplete dropdowns that just appeared
  const dropdownSelectors = [
    '[role="listbox"]',
    '.autocomplete-results',
    '[class*="autocomplete"]',
    '[class*="dropdown-menu"]',
    '[class*="suggestions"]',
    'ul[role="listbox"]',
    '[data-reach-listbox-popover]'
  ];
  
  for (const selector of dropdownSelectors) {
    const dropdowns = document.querySelectorAll(selector);
    dropdowns.forEach(dropdown => {
      // Check if dropdown is visible
      const style = window.getComputedStyle(dropdown);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        const rect = dropdown.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Find first option
          const firstOption = dropdown.querySelector('[role="option"], li:not([role="presentation"]), .option, [class*="option"]:not([class*="container"])');
          if (firstOption && !firstOption.hasAttribute('data-autocomplete-clicked')) {
            console.log("Mutation observer found dropdown, clicking:", firstOption.textContent?.trim());
            firstOption.setAttribute('data-autocomplete-clicked', 'true');
            
            // Try multiple click methods
            firstOption.click();
            
            // Dispatch mousedown and mouseup
            firstOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            firstOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            
            autocompleteClickAttempts++;
          }
        }
      }
    });
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Stop observing after 3 seconds
setTimeout(() => {
  observer.disconnect();
  console.log("Stopped observing for autocomplete dropdowns");
}, 3000);

chrome.storage.sync.get("profile", ({ profile }) => {
  if (!profile) {
    console.log("No profile found");
    return;
  }

  console.log("Autofilling with profile:", profile);
  
  // Ensure all profile sections exist
  profile.personal = profile.personal || {};
  profile.location = profile.location || {};
  profile.education = profile.education || {};
  profile.links = profile.links || {};
  profile.workAuth = profile.workAuth || {};
  profile.eeo = profile.eeo || {};

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
    
    // Check for aria-labelledby
    if (!labelText && el.getAttribute("aria-labelledby")) {
      const labelId = el.getAttribute("aria-labelledby");
      const labelEl = document.getElementById(labelId);
      if (labelEl) {
        labelText = labelEl.innerText;
      }
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
      if (parentText && parentText.length < 200) {
        labelText = parentText;
      }
    }
    
    // Check previous sibling for label text
    if (!labelText && el.previousElementSibling) {
      const siblingText = el.previousElementSibling.innerText;
      if (siblingText && siblingText.length < 200) {
        labelText = siblingText;
      }
    }
    
    // Check for fieldset legend (common in forms)
    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
      if (parent.tagName === 'FIELDSET') {
        const legend = parent.querySelector('legend');
        if (legend && !labelText) {
          labelText = legend.innerText;
        }
        break;
      }
      parent = parent.parentElement;
      depth++;
    }
    
    return labelText.toLowerCase();
  };

  // Helper: set input value (React-safe)
  const setInputValue = (input, value, handleAutocomplete = false) => {
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
      
      console.log(`Filled ${input.name || input.id || 'input'} with: ${value}`);
      
      // Handle autocomplete dropdowns (like school, company, etc.)
      if (handleAutocomplete) {
        // Focus the input to show dropdown
        input.focus();
        
        // Wait for autocomplete to appear and click first option
        setTimeout(() => {
          // Try multiple strategies to find and click the dropdown option
          
          // Strategy 1: Look for common autocomplete dropdown selectors
          const dropdownSelectors = [
            '[role="listbox"] [role="option"]',
            '.autocomplete-option',
            '.select-option',
            '[class*="option"]',
            '[class*="menu"] [role="option"]',
            'ul[role="listbox"] li',
            '.dropdown-item',
            '[data-option-index="0"]'
          ];
          
          let clicked = false;
          
          for (const selector of dropdownSelectors) {
            const options = document.querySelectorAll(selector);
            if (options.length > 0) {
              // Click the first option
              options[0].click();
              console.log(`Clicked first option using selector: ${selector}`);
              clicked = true;
              break;
            }
          }
          
          // Strategy 2: Press arrow down then enter
          if (!clicked) {
            const arrowDownEvent = new KeyboardEvent("keydown", {
              key: "ArrowDown",
              code: "ArrowDown",
              keyCode: 40,
              which: 40,
              bubbles: true,
              cancelable: true
            });
            input.dispatchEvent(arrowDownEvent);
            
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
              
              const enterEventUp = new KeyboardEvent("keyup", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              input.dispatchEvent(enterEventUp);
              
              console.log(`Pressed ArrowDown + Enter on ${input.name || input.id || 'input'}`);
            }, 100);
          }
        }, 300); // Wait for dropdown to appear
      } else {
        input.dispatchEvent(new Event("blur", { bubbles: true }));
      }
      
    } catch (error) {
      console.error("Error setting input value:", error);
      input.value = value;
    }
  };

  // Helper: fill dropdown
  const fillSelect = (select, value) => {
    if (!value) return;
    
    try {
      const valueStr = value.toString().toLowerCase().trim();
      
      console.log(`Attempting to fill select with value: "${valueStr}"`);
      console.log(`Available options:`, [...select.options].map(o => `"${o.text}" (value: "${o.value}")`));
      
      // Try exact match on value attribute
      let option = [...select.options].find(
        (o) => o.value.toLowerCase().trim() === valueStr
      );
      
      // Try exact match on text
      if (!option) {
        option = [...select.options].find(
          (o) => o.text.toLowerCase().trim() === valueStr
        );
      }
      
      // Try partial match on text
      if (!option) {
        option = [...select.options].find(
          (o) => o.text.toLowerCase().includes(valueStr)
        );
      }
      
      // Try partial match on value
      if (!option) {
        option = [...select.options].find(
          (o) => o.value.toLowerCase().includes(valueStr)
        );
      }
      
      // For Yes/No, try matching just the first letter or common variations
      if (!option && (valueStr === 'yes' || valueStr === 'no')) {
        option = [...select.options].find(
          (o) => {
            const text = o.text.toLowerCase().trim();
            const val = o.value.toLowerCase().trim();
            return text === valueStr || val === valueStr || 
                   text.startsWith(valueStr) || val.startsWith(valueStr);
          }
        );
      }
      
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        select.dispatchEvent(new Event("blur", { bubbles: true }));
        console.log(`✓ Selected "${option.text}" in ${select.name || select.id || 'select'}`);
      } else {
        console.log(`✗ Could not find matching option for "${valueStr}"`);
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

    // Check if this is a Select2 search field (they have ids like s2id_autogen#_search)
    const isSelect2Search = input.id && input.id.includes('s2id_autogen') && input.id.includes('_search');
    
    // For Select2 dropdowns, we need to fill the hidden select instead
    if (isSelect2Search) {
      console.log("Skipping Select2 search input, will handle via select element");
      return;
    }

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
    console.log(`Checking select with label: "${label}"`);

    // Office/location preference - check first since it's specific
    if ((label.includes("willing") || label.includes("able")) && label.includes("office")) {
      console.log("Found office preference dropdown");
      fillSelect(select, profile.workAuth.officePreference || "");
    }
    else if (label.includes("work") && (label.includes("office") || label.includes("location") || label.includes("sf") || label.includes("nyc"))) {
      console.log("Found office/location work dropdown");
      fillSelect(select, profile.workAuth.officePreference || "");
    }
    // Work authorization - be very specific - CHECK THESE FIRST!
    else if (label.includes("legally authorized") && label.includes("work")) {
      console.log("Found 'legally authorized to work' dropdown");
      fillSelect(select, profile.workAuth.legallyAuthorized || "");
    }
    else if (label.includes("authorized") && label.includes("work") && label.includes("us")) {
      console.log("Found 'authorized to work in US' dropdown");
      fillSelect(select, profile.workAuth.legallyAuthorized || "");
    }
    else if (label.includes("legal") && label.includes("work")) {
      console.log("Found legal work authorization dropdown");
      fillSelect(select, profile.workAuth.legallyAuthorized || "");
    }
    // Sponsorship - be very specific
    else if (label.includes("will you") && label.includes("require") && label.includes("sponsorship")) {
      console.log("Found 'will you require sponsorship' dropdown");
      fillSelect(select, profile.workAuth.sponsorshipRequired || "");
    }
    else if (label.includes("visa") && label.includes("sponsorship")) {
      console.log("Found 'visa sponsorship' dropdown");
      fillSelect(select, profile.workAuth.sponsorshipRequired || "");
    }
    else if (label.includes("require") && (label.includes("visa") || label.includes("sponsorship"))) {
      console.log("Found 'require visa/sponsorship' dropdown");
      fillSelect(select, profile.workAuth.sponsorshipRequired || "");
    }
    // Education graduation year (expected graduation)
    else if ((label.includes("graduation") || label.includes("expected")) && label.includes("year")) {
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
  });

  // --- Handle Select2 dropdowns (Greenhouse uses these) ---
  console.log("Checking for Select2 dropdowns...");
  
  // Find all Select2 containers
  const select2Containers = document.querySelectorAll('.select2-container');
  select2Containers.forEach(container => {
    // Find the associated hidden select
    const selectId = container.id.replace('s2id_', '');
    const hiddenSelect = document.getElementById(selectId);
    
    if (!hiddenSelect) return;
    
    const label = getLabelText(hiddenSelect).trim();
    console.log(`Found Select2 dropdown with label: "${label}"`);
    
    let valueToSelect = null;
    
    // Match based on label
    if (label.includes("willing") && label.includes("office")) {
      valueToSelect = profile.workAuth.officePreference || "";
      console.log("Select2: office preference");
    } else if (label.includes("legally authorized") || (label.includes("authorized") && label.includes("work"))) {
      valueToSelect = profile.workAuth.legallyAuthorized || "";
      console.log("Select2: legally authorized");
    } else if (label.includes("sponsorship") || (label.includes("visa") && label.includes("require"))) {
      valueToSelect = profile.workAuth.sponsorshipRequired || "";
      console.log("Select2: sponsorship");
    } else if (label.includes("graduation") && label.includes("year")) {
      valueToSelect = profile.education.graduationYear || "";
      console.log("Select2: graduation year");
    }
    
    if (valueToSelect) {
      // Try to set the value on the hidden select
      const valueStr = valueToSelect.toString().toLowerCase().trim();
      const option = [...hiddenSelect.options].find(o => 
        o.text.toLowerCase().trim() === valueStr || 
        o.value.toLowerCase().trim() === valueStr ||
        o.text.toLowerCase().includes(valueStr) ||
        o.value.toLowerCase().includes(valueStr)
      );
      
      if (option) {
        console.log(`Select2: Setting value to "${option.text}"`);
        hiddenSelect.value = option.value;
        
        // Trigger Select2's change event
        if (window.jQuery && window.jQuery.fn.select2) {
          $(hiddenSelect).trigger('change');
        } else {
          // Fallback to vanilla JS events
          hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
          hiddenSelect.dispatchEvent(new Event('select2:select', { bubbles: true }));
        }
        
        // Also try updating the UI directly
        const displayElement = container.querySelector('.select2-chosen');
        if (displayElement) {
          displayElement.textContent = option.text;
        }
      }
    }
  });

  // --- Fill radio buttons for sponsorship and work auth ---
  if (profile.workAuth.legallyAuthorized) {
    fillRadio("legally authorized", profile.workAuth.legallyAuthorized);
    fillRadio("legal authorization", profile.workAuth.legallyAuthorized);
    fillRadio("authorized to work", profile.workAuth.legallyAuthorized);
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

  // --- Additional autocomplete handler: Click visible dropdown options ---
  setTimeout(() => {
    console.log("Checking for visible autocomplete dropdowns...");
    
    // Common selectors for autocomplete dropdowns
    const dropdownSelectors = [
      '[role="listbox"]:not([style*="display: none"])',
      '.autocomplete-dropdown:not([style*="display: none"])',
      '[class*="dropdown"][class*="menu"]:not([style*="display: none"])',
      'ul[role="listbox"]:not([style*="display: none"])',
      '.select-dropdown:not([style*="display: none"])'
    ];
    
    for (const selector of dropdownSelectors) {
      const dropdowns = document.querySelectorAll(selector);
      dropdowns.forEach(dropdown => {
        // Check if dropdown is actually visible
        const rect = dropdown.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Find first option and click it
          const firstOption = dropdown.querySelector('[role="option"], li, .option, [class*="option"]');
          if (firstOption) {
            console.log("Found visible dropdown, clicking first option:", firstOption.textContent);
            firstOption.click();
          }
        }
      });
    }
  }, 800);

  console.log("Autofill complete!");
});