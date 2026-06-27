// form-filler.js
(function () {
  const FIELD_MAP = [
    { field: 'full_name_text', candidates: ['name', 'full_name', 'your_name', 'applicant_name', 'fullname', 'firstname lastname'] },
    { field: 'email', candidates: ['email', 'email_address', 'e-mail'] },
    { field: 'phone_number_text', candidates: ['phone', 'phone_number', 'mobile', 'telephone'] },
    { field: 'address_line_text', candidates: ['address', 'street_address', 'address_line_1'] },
    { field: 'city_text', candidates: ['city', 'town'] },
    { field: 'region_text', candidates: ['region', 'state', 'county'] },
    { field: 'country_text', candidates: ['country'] },
    { field: 'linkedin_url_text', candidates: ['linkedin', 'linkedin_url', 'linkedin_profile'] },
    { field: 'portfolio_url_text', candidates: ['portfolio', 'website', 'personal_website'] },
    { field: 'github_url_text', candidates: ['github', 'github_url'] }
  ];

  function findFieldElementForName(candidateNames) {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const loweredCandidates = candidateNames.map(s => s.toLowerCase());
    const findBy = (el) => {
      const name = (el.getAttribute('name') || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      if (loweredCandidates.some(c => name.includes(c) || id.includes(c) || placeholder.includes(c) || aria.includes(c))) return true;
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label && loweredCandidates.some(c => (label.innerText || '').toLowerCase().includes(c))) return true;
      }
      const parentLabel = el.closest('label');
      if (parentLabel && loweredCandidates.some(c => (parentLabel.innerText || '').toLowerCase().includes(c))) return true;
      return false;
    };
    return inputs.find(findBy) || null;
  }

  async function trySetFileInput(inputEl, fileUrl, fileName) {
    if (!inputEl || !fileUrl) return false;
    try {
      const resp = await fetch(fileUrl);
      if (!resp.ok) return false;
      const blob = await resp.blob();
      const file = new File([blob], fileName || 'resume.pdf', { type: blob.type || 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(file);
      inputEl.files = dt.files;
      const ev = new Event('change', { bubbles: true });
      inputEl.dispatchEvent(ev);
      return true;
    } catch (err) {
      console.warn('File set failed', err);
      return false;
    }
  }

  function setInputValue(el, value) {
    if (!el || value == null) return;
    const tag = el.tagName.toLowerCase();
    if (tag === 'select') {
      try { el.value = value; } catch (e) {}
    } else if (tag === 'input' || tag === 'textarea') {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        if (String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes') el.checked = true;
      } else {
        el.focus && el.focus();
        el.value = value;
      }
    }
    ['input', 'change', 'blur'].forEach(n => el.dispatchEvent(new Event(n, { bubbles: true })));
  }

  async function fillAllForms(profile = {}, cv = null) {
    FIELD_MAP.forEach(mapping => {
      const el = findFieldElementForName(mapping.candidates);
      if (el && profile[mapping.field]) {
        setInputValue(el, profile[mapping.field]);
      }
    });
    const cvCandidates = ['resume', 'cv', 'resume_file', 'upload_resume', 'cv_file', 'upload_cv'];
    const fileInput = findFieldElementForName(cvCandidates);
    if (fileInput && fileInput.tagName.toLowerCase() === 'input' && fileInput.type === 'file') {
      if (cv && cv.file_file) {
        await trySetFileInput(fileInput, cv.file_file, cv.file_name_text || 'resume.pdf');
      }
    }
    return true;
  }

  window.formFiller = { fillAllForms };
})();
