// Content script for autofill
chrome.storage.sync.get("profile", ({ profile }) => {
  if (!profile) return;

  const inputs = document.querySelectorAll("input, textarea");
  const selects = document.querySelectorAll("select");
  const radios = document.querySelectorAll("input[type=radio]");

  // Helper: get label text
  const getLabelText = (el) => {
    return (
      el.labels?.[0]?.innerText?.toLowerCase() ||
      el.placeholder?.toLowerCase() ||
      el.name?.toLowerCase() ||
      el.getAttribute("aria-label")?.toLowerCase() ||
      ""
    );
  };

  // Helper: set input value (React-safe)
  const setInputValue = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    ).set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Helper: fill dropdown
  const fillSelect = (select, value) => {
    if (!value) return;
    const option = [...select.options].find(
      (o) => o.text.toLowerCase().includes(value.toLowerCase())
    );
    if (option) {
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  // Helper: fill radio buttons
  const fillRadio = (group, value) => {
    [...group].forEach((r) => {
      if (r.value.toLowerCase().includes(value.toLowerCase())) {
        r.click();
      }
    });
  };

  // --- Fill text inputs ---
  inputs.forEach((input) => {
    const label = getLabelText(input);

    // Personal
    if (label.includes("first name")) setInputValue(input, profile.personal.firstName || "");
    if (label.includes("last name")) setInputValue(input, profile.personal.lastName || "");
    if (label.includes("preferred")) setInputValue(input, profile.personal.preferredFirstName || "");
    if (label.includes("email")) setInputValue(input, profile.personal.email || "");
    if (label.includes("phone")) setInputValue(input, profile.personal.phone || "");

    // Location
    if (label.includes("address")) setInputValue(input, profile.location.address || "");
    if (label.includes("city")) setInputValue(input, profile.location.city || "");
    if (label.includes("county")) setInputValue(input, profile.location.county || "");
    if (label.includes("zip")) setInputValue(input, profile.location.zipcode || "");
    if (label.includes("country")) setInputValue(input, profile.location.country || "");

    // Education
    if (label.includes("school") || label.includes("university") || label.includes("college"))
      setInputValue(input, profile.education.school || "");
    if (label.includes("degree")) setInputValue(input, profile.education.degree || "");

    // Links
    if (label.includes("linkedin")) setInputValue(input, profile.links.linkedin || "");
    if (label.includes("website") || label.includes("portfolio") || label.includes("personal site"))
      setInputValue(input, profile.links.website || "");
  });

  // --- Fill dropdowns ---
  selects.forEach((select) => {
    const label = getLabelText(select);

    // Education end date
    if (label.includes("end month")) fillSelect(select, profile.education.endMonth || "");
    if (label.includes("end year")) fillSelect(select, profile.education.endYear || "");

    // EEO / demographics
    if (label.includes("gender")) fillSelect(select, profile.eeo.gender || "");
    if (label.includes("hispanic")) fillSelect(select, profile.eeo.hispanicLatino || "");
    if (label.includes("race")) fillSelect(select, profile.eeo.race || "");
    if (label.includes("veteran")) fillSelect(select, profile.eeo.veteranStatus || "");
    if (label.includes("disability")) fillSelect(select, profile.eeo.disabilityStatus || "");

    // Work authorization
    if (label.includes("sponsorship")) fillSelect(select, profile.workAuth.sponsorshipRequired || "");
  });

  // --- Fill radio buttons ---
  // Sponsorship yes/no example
  const sponsorshipRadios = Array.from(radios).filter((r) =>
    getLabelText(r).includes("sponsorship")
  );
  if (sponsorshipRadios.length && profile.workAuth.sponsorshipRequired)
    fillRadio(sponsorshipRadios, profile.workAuth.sponsorshipRequired);

  // Optional: other yes/no radio groups can be added similarly

  // --- Highlight resume upload field ---
  const fileInput = document.querySelector("input[type=file]");
  if (fileInput) {
    fileInput.scrollIntoView({ behavior: "smooth" });
    fileInput.style.outline = "3px solid orange";
  }

  // --- Auto-click "Next" / "Continue" / "Submit" buttons (optional) ---
  // document.querySelectorAll("button").forEach(btn => {
  //   if (/next|continue|submit|apply/i.test(btn.innerText)) btn.click();
  // });
});
