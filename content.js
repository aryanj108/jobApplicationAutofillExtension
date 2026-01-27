chrome.storage.sync.get(null, (data) => {
  const inputs = document.querySelectorAll("input, textarea");

  inputs.forEach(input => {
    const name = (input.name || "").toLowerCase();
    const placeholder = (input.placeholder || "").toLowerCase();

    if (name.includes("name") || placeholder.includes("name")) {
      input.value = data.fullName || "";
    }

    if (name.includes("email") || placeholder.includes("email")) {
      input.value = data.email || "";
    }

    if (name.includes("linkedin")) {
      input.value = data.linkedin || "";
    }

    if (name.includes("github") || placeholder.includes("github")) {
      input.value = data.github || "";
    }

    if (label.includes("linkedin")) {
    input.value = profile.links.linkedin;
    }

    if (
    label.includes("website") ||
    label.includes("portfolio") ||
    label.includes("personal site")
    ) {
    input.value = profile.links.website;
    }

    if (
    label.includes("school") ||
    label.includes("university") ||
    label.includes("college")
    ) {
    input.value = profile.education.school;
    }

    if (label.includes("degree")) {
    input.value = profile.education.degree;
    }


    // Important: tell the site the input changed
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Click buttons like Next / Submit
  document.querySelectorAll("button").forEach(button => {
    if (/next|continue|apply/i.test(button.innerText)) {
      button.click();
    }
  });
});

chrome.storage.sync.get("profile", ({ profile }) => {
  document.querySelectorAll("input").forEach(input => {
    const label =
      input.labels?.[0]?.innerText.toLowerCase() ||
      input.placeholder?.toLowerCase() ||
      "";

    if (label.includes("first name")) input.value = profile.personal.firstName;
    if (label.includes("last name")) input.value = profile.personal.lastName;
    if (label.includes("email")) input.value = profile.personal.email;
    if (label.includes("phone")) input.value = profile.personal.phone;

    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
});

