// content.js - main content script
(function () {
  const EXT_IFRAME_ID = 'taprac_sidebar_iframe';
  const LOGIN_IFRAME_ID = 'taprac_login_iframe';
  const TAPRAC_BUTTON_ID = 'taprac_apply_button';
  const BRAND_COLOR = '#8F63E9';
  const TOKEN_KEY = 'taprac_token';
  const USER_ID_KEY = 'taprac_user_id';
  const browserAPI = window.browser || chrome;

  function postToIframe(iframeId, msg) {
    const iframe = document.getElementById(iframeId);
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, '*');
    }
  }

  function injectApplyButton() {
    if (document.getElementById(TAPRAC_BUTTON_ID)) return;
    const btn = document.createElement('button');
    btn.id = TAPRAC_BUTTON_ID;
    btn.textContent = 'Apply with Taprac';
    btn.style.position = 'fixed';
    btn.style.right = '18px';
    btn.style.bottom = '18px';
    btn.style.zIndex = 2147483647;
    btn.style.background = BRAND_COLOR;
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.padding = '10px 14px';
    btn.style.borderRadius = '8px';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '14px';
    btn.style.fontFamily = 'Arial, sans-serif';
    btn.addEventListener('click', onApplyClicked);
    document.body.appendChild(btn);
  }

  function openSidebar() {
    let iframe = document.getElementById(EXT_IFRAME_ID);
    if (iframe) {
      iframe.style.display = 'block';
      return;
    }
    iframe = document.createElement('iframe');
    iframe.id = EXT_IFRAME_ID;
    iframe.src = chrome.runtime.getURL('sidebar.html');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.right = '0';
    iframe.style.width = '420px';
    iframe.style.height = '100%';
    iframe.style.zIndex = 2147483647;
    iframe.style.border = '0';
    iframe.style.boxShadow = '-6px 0 24px rgba(0,0,0,0.2)';
    iframe.style.background = '#fff';
    document.body.appendChild(iframe);
    iframe.addEventListener('load', () => {
      const job = (window.jobScraper && window.jobScraper.getJobInfo)
        ? window.jobScraper.getJobInfo()
        : { job_title: '', company_name: '', job_description: '' };
      postToIframe(EXT_IFRAME_ID, { type: 'init', job });
    });
  }

  function openLoginPopup() {
    if (document.getElementById(LOGIN_IFRAME_ID)) return;
    const iframe = document.createElement('iframe');
    iframe.id = LOGIN_IFRAME_ID;
    iframe.src = chrome.runtime.getURL('login-popup.html');
    iframe.style.position = 'fixed';
    iframe.style.right = '18px';
    iframe.style.bottom = '70px';
    iframe.style.width = '380px';
    iframe.style.height = '420px';
    iframe.style.zIndex = 2147483647;
    iframe.style.border = '0';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    document.body.appendChild(iframe);
  }

  function closeLoginPopup() {
    const iframe = document.getElementById(LOGIN_IFRAME_ID);
    if (iframe) iframe.remove();
  }

  window.addEventListener('message', async (ev) => {
    if (!ev.data || !ev.data.type) return;
    const data = ev.data;
    try {
      if (data.type === 'request_login') {
        openLoginPopup();
      } else if (data.type === 'login_submit') {
        const res = await loginUser(data.email, data.password);
        postToIframe(LOGIN_IFRAME_ID, { type: 'login_result', result: res });
        if (res && res.ok) {
          closeLoginPopup();
          const sub = await checkSubscription(res.user_id, res.token);
          if (!sub.ok) {
            openSidebar();
            postToIframe(EXT_IFRAME_ID, { type: 'subscription_error', message: sub.message });
            return;
          }
          openSidebar();
          const job = (window.jobScraper && window.jobScraper.getJobInfo) ? window.jobScraper.getJobInfo() : {};
          postToIframe(EXT_IFRAME_ID, { type: 'login_success', job });
        }
      } else if (data.type === 'get_profile') {
        const token = window.localStorage.getItem(TOKEN_KEY);
        const user_id = window.localStorage.getItem(USER_ID_KEY);
        if (!token || !user_id) {
          postToIframe(EXT_IFRAME_ID, { type: 'no_token' });
          return;
        }
        const profile = await fetchProfile(user_id, token);
        const work = await fetchWork(user_id, token);
        const education = await fetchEducation(user_id, token);
        const skills = await fetchSkills(user_id, token);
        const cv = await fetchCV(user_id, token);
        postToIframe(EXT_IFRAME_ID, {
          type: 'profile_data',
          profile, work, education, skills, cv
        });
      } else if (data.type === 'fill_form') {
        try {
          await window.formFiller.fillAllForms(data.profile, data.cv);
          postToIframe(EXT_IFRAME_ID, { type: 'fill_done', message: 'Form fields auto-filled' });
        } catch (err) {
          postToIframe(EXT_IFRAME_ID, { type: 'fill_error', message: String(err) });
        }
      } else if (data.type === 'generate_cover_letter') {
        const token = window.localStorage.getItem(TOKEN_KEY);
        const user_id = window.localStorage.getItem(USER_ID_KEY);
        if (!token || !user_id) {
          postToIframe(EXT_IFRAME_ID, { type: 'cover_unavailable', message: 'Not logged in' });
          return;
        }
        try {
          const resp = await generateCoverLetter(user_id, token, data.job_title, data.company_name, data.job_description);
          if (resp && resp.cover_letter) {
            postToIframe(EXT_IFRAME_ID, { type: 'cover_generated', cover_letter: resp.cover_letter });
          } else {
            postToIframe(EXT_IFRAME_ID, { type: 'cover_unavailable', message: 'Cover letter generation unavailable - please add manually' });
          }
        } catch (err) {
          postToIframe(EXT_IFRAME_ID, { type: 'cover_unavailable', message: 'Cover letter generation unavailable - please add manually' });
        }
      } else if (data.type === 'submit_application') {
        const result = await submitApplicationFlow(data);
        postToIframe(EXT_IFRAME_ID, { type: 'submit_result', result });
      } else if (data.type === 'close_sidebar') {
        const iframe = document.getElementById(EXT_IFRAME_ID);
        if (iframe) iframe.remove();
      }
    } catch (err) {
      console.error('Taprac message handler error', err);
      postToIframe(EXT_IFRAME_ID, { type: 'error', message: String(err) });
    }
  });

  function onApplyClicked() {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      openLoginPopup();
      return;
    }
    const user_id = window.localStorage.getItem(USER_ID_KEY);
    if (!user_id) {
      window.localStorage.removeItem(TOKEN_KEY);
      openLoginPopup();
      return;
    }
    checkSubscription(user_id, token).then((sc) => {
      if (!sc.ok) {
        openSidebar();
        postToIframe(EXT_IFRAME_ID, { type: 'subscription_error', message: sc.message });
        return;
      }
      openSidebar();
      const job = (window.jobScraper && window.jobScraper.getJobInfo) ? window.jobScraper.getJobInfo() : {};
      postToIframe(EXT_IFRAME_ID, { type: 'login_success', job });
    }).catch((err) => {
      openLoginPopup();
    });
  }

  async function loginUser(email, password) {
    const url = TAPRAC_BASE_URL + '/user/login';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, message: `Login failed: ${res.status} ${text}` };
      }
      const data = await res.json();
      const resolvedToken = (data.response && data.response.token) ? data.response.token : (data.token ? data.token : null);
      const user_id = (data.response && data.response.user_id) ? data.response.user_id : (data.user_id ? data.user_id : null);
      if (resolvedToken && user_id) {
        window.localStorage.setItem(TOKEN_KEY, resolvedToken);
        window.localStorage.setItem(USER_ID_KEY, user_id);
        return { ok: true, token: resolvedToken, user_id };
      }
      return { ok: false, message: 'Login did not return token/user_id' };
    } catch (err) {
      return { ok: false, message: 'Network error during login' };
    }
  }

  async function checkSubscription(user_id, token) {
    if (!user_id || !token) return { ok: false, message: 'Not logged in' };
    const url = `${TAPRAC_BASE_URL}/obj/user/${encodeURIComponent(user_id)}`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(USER_ID_KEY);
          return { ok: false, message: 'Authentication failed - please log in again' };
        }
        const txt = await res.text();
        return { ok: false, message: `Subscription check failed: ${res.status} ${txt}` };
      }
      const data = await res.json();
      const payload = data.response || data;
      const plan = payload.subscription_plan_text;
      if (!plan) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_ID_KEY);
        return { ok: false, message: 'You need an active Taprac subscription to use this extension. Please visit taprac.com to subscribe.' };
      }
      return { ok: true, plan };
    } catch (err) {
      return { ok: false, message: 'Network error during subscription check' };
    }
  }

  async function fetchProfile(user_id, token) {
    try {
      const res = await fetch(`${TAPRAC_BASE_URL}/obj/user/${encodeURIComponent(user_id)}`, { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) return null;
      const data = await res.json();
      const payload = data.response || data;
      return {
        email: payload.email || '',
        full_name_text: payload.full_name_text || '',
        phone_number_text: payload.phone_number_text || '',
        phone_country_code_text: payload.phone_country_code_text || '',
        address_line_text: payload.address_line_text || '',
        city_text: payload.city_text || '',
        region_text: payload.region_text || '',
        country_text: payload.country_text || '',
        linkedin_url_text: payload.linkedin_url_text || '',
        portfolio_url_text: payload.portfolio_url_text || '',
        github_url_text: payload.github_url_text || '',
        date_of_birth_date: payload.date_of_birth_date || '',
        nationality_text: payload.nationality_text || ''
      };
    } catch (err) {
      return null;
    }
  }

  async function fetchWork(user_id, token) {
    try {
      const q = encodeURIComponent(JSON.stringify([{ key: 'user', constraint_type: 'equals', value: user_id }]));
      const res = await fetch(`${TAPRAC_BASE_URL}/obj/workexperience?constraints=${q}`, { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) return [];
      const data = await res.json();
      return data.response || data;
    } catch (err) {
      return [];
    }
  }

  async function fetchEducation(user_id, token) {
    try {
      const q = encodeURIComponent(JSON.stringify([{ key: 'user', constraint_type: 'equals', value: user_id }]));
      const res = await fetch(`${TAPRAC_BASE_URL}/obj/education?constraints=${q}`, { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) return [];
      const data = await res.json();
      return data.response || data;
    } catch (err) {
      return [];
    }
  }

  async function fetchSkills(user_id, token) {
    try {
      const q = encodeURIComponent(JSON.stringify([{ key: 'user', constraint_type: 'equals', value: user_id }]));
      const res = await fetch(`${TAPRAC_BASE_URL}/obj/skill?constraints=${q}`, { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) return [];
      const data = await res.json();
      return data.response || data;
    } catch (err) {
      return [];
    }
  }

  async function fetchCV(user_id, token) {
    try {
      const q = encodeURIComponent(JSON.stringify([
        { key: 'user', constraint_type: 'equals', value: user_id },
        { key: 'is_default', constraint_type: 'equals', value: true }
      ]));
      const res = await fetch(`${TAPRAC_BASE_URL}/obj/cvfile?constraints=${q}`, { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) return null;
      const data = await res.json();
      const list = data.response || data;
      if (Array.isArray(list) && list.length) {
        const first = list[0];
        return {
          file_file: first.file_file || '',
          file_name_text: first.file_name_text || ''
        };
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  async function generateCoverLetter(user_id, token, job_title, company_name, job_description) {
    try {
      const res = await fetch(`${TAPRAC_BASE_URL}/wf/generate-cover-letter-secure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id,
          job_title,
          company_name,
          job_description
        })
      });
      if (!res.ok) {
        throw new Error('generate endpoint not available');
      }
      const data = await res.json();
      return data.response || data;
    } catch (err) {
      throw err;
    }
  }

  async function submitApplicationFlow({ job_title, company_name, cover_letter_text, source_url }) {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const user_id = window.localStorage.getItem(USER_ID_KEY);
    if (!token || !user_id) return { ok: false, message: 'Not logged in' };
    try {
      const forms = Array.from(document.querySelectorAll('form'));
      let targetForm = forms.find(f => {
        return Array.from(f.querySelectorAll('input, textarea, select')).some(el => {
          const name = (el.name || '').toLowerCase();
          return name.includes('apply') || name.includes('resume') || name.includes('cover') || name.includes('submit');
        });
      }) || forms[0];
      const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button[class*="apply"], button[id*="apply"]');
      if (targetForm) {
        if (submitButton) {
          submitButton.click();
        } else {
          try {
            targetForm.submit();
          } catch (err) {
            console.warn('Programmatic submit failed', err);
            return { ok: false, message: 'Unable to submit programmatically. Please click the website\'s Submit/Apply button.' };
          }
        }
      } else {
        if (submitButton) {
          submitButton.click();
        } else {
          return { ok: false, message: 'No application form found on this page to submit.' };
        }
      }
    } catch (err) {
      console.error('Submit attempt error', err);
      return { ok: false, message: 'Error while attempting to submit: ' + String(err) };
    }
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await fetch(`${TAPRAC_BASE_URL}/obj/application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user: user_id,
          job_title,
          company: company_name,
          source_website: source_url || location.href,
          status: 'Applied',
          date_applied: new Date().toISOString().slice(0, 10)
        })
      });
      if (!res.ok) {
        console.warn('Application log failed', res.status);
      }
    } catch (err) {
      console.warn('Application log error', err);
    }
    if (cover_letter_text && cover_letter_text.trim()) {
      try {
        const res2 = await fetch(`${TAPRAC_BASE_URL}/obj/aicoverletter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            user: user_id,
            job_title,
            company_name,
            job_description: '',
            generated_content: cover_letter_text
          })
        });
        if (!res2.ok) {
          console.warn('Save cover letter failed', res2.status);
        }
      } catch (err) {
        console.warn('Save cover letter error', err);
      }
    }
    return { ok: true, message: 'Application submitted & saved to Taprac ✅' };
  }

  async function subscriptionExpiryCheckOnLoad() {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const user_id = window.localStorage.getItem(USER_ID_KEY);
    if (!token || !user_id) return;
    const sc = await checkSubscription(user_id, token);
    if (!sc.ok) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_ID_KEY);
      const bar = document.createElement('div');
      bar.textContent = 'Your Taprac subscription has expired. Please renew at taprac.com';
      bar.style.position = 'fixed';
      bar.style.top = '12px';
      bar.style.right = '12px';
      bar.style.background = '#fff3f3';
      bar.style.color = '#000';
      bar.style.padding = '10px 14px';
      bar.style.border = '1px solid #ffb3b3';
      bar.style.zIndex = 2147483647;
      bar.style.borderRadius = '6px';
      document.body.appendChild(bar);
      setTimeout(() => bar.remove(), 10000);
    }
  }

  injectApplyButton();
  subscriptionExpiryCheckOnLoad();
  window.taprac = window.taprac || {};
})();
