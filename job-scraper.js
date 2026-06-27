// job-scraper.js - site-specific heuristics
(function () {
  function getMetaContent(names) {
    for (const name of names) {
      const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (el && el.content) return el.content;
    }
    return '';
  }

  function textOf(selector) {
    try {
      const el = document.querySelector(selector);
      return el ? el.innerText.trim() : '';
    } catch (e) {
      return '';
    }
  }

  function firstNonEmpty(arr) {
    for (const v of arr) if (v && v.trim()) return v.trim();
    return '';
  }

  function scrapeLinkedIn() {
    const jobTitle = firstNonEmpty([
      textOf('.top-card-layout__title'),
      textOf('h1[class*="title"]'),
      textOf('[data-test-id="job-details-title"]')
    ]);
    const company = firstNonEmpty([
      textOf('.topcard__org-name-link'),
      textOf('[class*="topcard"] a[href*="/company/"]'),
      textOf('[data-test-id="job-details-company"]')
    ]);
    const desc = firstNonEmpty([
      textOf('.description__text'),
      textOf('#job-details'),
      textOf('[class*="show-more-less-html__markup"]'),
      textOf('[data-test-id="job-details-description"]')
    ]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function scrapeIndeed() {
    const jobTitle = firstNonEmpty([
      textOf('.jobsearch-JobInfoHeader-title'),
      textOf('h1[class*="jobsearch"]'),
      textOf('[class*="jobTitle"]'),
      textOf('h1[data-testid*="title"]')
    ]);
    const company = firstNonEmpty([
      textOf('[data-testid="inlineHeader-companyName"]'),
      textOf('.icl-u-lg-mr--sm'),
      textOf('[class*="companyName"]'),
      textOf('[class*="company"]')
    ]);
    const desc = firstNonEmpty([
      textOf('#jobDescriptionText'),
      textOf('[class*="jobDescriptionText"]'),
      textOf('[id*="description"]'),
      textOf('[class*="description"]')
    ]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function scrapeGlassdoor() {
    const jobTitle = firstNonEmpty([
      textOf('.css-17x2pwl'),
      textOf('h2[data-test="job-title"]'),
      textOf('[class*="jobTitle"]'),
      textOf('h2[class*="JobTitle"]')
    ]);
    const company = firstNonEmpty([
      textOf('[data-test="employerName"]'),
      textOf('.css-16nw49e'),
      textOf('[class*="EmployerName"]'),
      textOf('[class*="employer"]')
    ]);
    const desc = firstNonEmpty([
      textOf('#JobDescription'),
      textOf('[data-test="job-description"]'),
      textOf('[class*="JobDescription"]'),
      textOf('[id*="jobDescription"]')
    ]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function scrapeZipRecruiter() {
    const jobTitle = firstNonEmpty([textOf('[data-testid="job-title"]'), textOf('h1[class*="title"]'), textOf('[class*="JobTitle"]')]);
    const company = firstNonEmpty([textOf('[data-testid="company-link"]'), textOf('[class*="company"]'), textOf('a[href*="/company/"]')]);
    const desc = firstNonEmpty([textOf('[data-testid="job-description"]'), textOf('[id*="description"]'), textOf('[class*="description"]')]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function scrapeMonster() {
    const jobTitle = firstNonEmpty([textOf('h1[class*="title"]'), textOf('[data-test="job-title"]'), textOf('[class*="JobTitle"]')]);
    const company = firstNonEmpty([textOf('[class*="company-name"]'), textOf('[data-test="company"]'), textOf('[href*="/company/"]')]);
    const desc = firstNonEmpty([textOf('[class*="job-description"]'), textOf('[id*="description"]'), textOf('[class*="full-description"]')]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function scrapeFlexJobs() {
    const jobTitle = firstNonEmpty([textOf('h1'), textOf('[class*="job-title"]'), textOf('[data-test="job-title"]')]);
    const company = firstNonEmpty([textOf('[class*="company"]'), textOf('strong'), textOf('[class*="employer"]')]);
    const desc = firstNonEmpty([textOf('[class*="job-description"]'), textOf('[id*="description"]'), textOf('.job-description')]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function scrapeReed() {
    const jobTitle = firstNonEmpty([textOf('h1[class*="title"]'), textOf('[class*="job-title"]'), textOf('[data-qa="jobAdTitle"]')]);
    const company = firstNonEmpty([textOf('[data-qa="jobAdEmployerName"]'), textOf('[class*="company"]'), textOf('[class*="employer"]')]);
    const desc = firstNonEmpty([textOf('[data-qa="jobAdDescription"]'), textOf('[id*="description"]'), textOf('[class*="job-description"]')]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function scrapeTotaljobs() {
    const jobTitle = firstNonEmpty([textOf('h1[class*="title"]'), textOf('[class*="job-title"]'), textOf('h1')]);
    const company = firstNonEmpty([textOf('[class*="company-name"]'), textOf('[class*="employer"]'), textOf('a[href*="/company/"]')]);
    const desc = firstNonEmpty([textOf('[class*="job-description"]'), textOf('[id*="description"]'), textOf('.description')]);
    return { job_title: jobTitle, company_name: company, job_description: desc };
  }

  function genericScrape() {
    try {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const s of scripts) {
        try {
          const json = JSON.parse(s.innerText);
          if (json && (json['@type'] === 'JobPosting' || (Array.isArray(json) && json.some(i => i['@type'] === 'JobPosting')))) {
            const job = Array.isArray(json) ? json.find(i => i['@type'] === 'JobPosting') : json;
            const title = job.title || job.jobTitle || '';
            const company = (job.hiringOrganization && job.hiringOrganization.name) || '';
            const desc = job.description || job.jobDescription || '';
            if (title && company && desc) {
              return { job_title: title, company_name: company, job_description: desc };
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
    const titleMeta = getMetaContent(['og:title', 'twitter:title']) || document.title;
    const descMeta = getMetaContent(['og:description', 'description', 'twitter:description']);
    const host = location.hostname.split('.').slice(-2).join('.');
    return { job_title: titleMeta, company_name: host, job_description: descMeta };
  }

  function getJobInfo() {
    const host = location.hostname;
    let info = {};
    if (host.includes('linkedin.com')) info = scrapeLinkedIn();
    else if (host.includes('indeed.')) info = scrapeIndeed();
    else if (host.includes('glassdoor.')) info = scrapeGlassdoor();
    else if (host.includes('ziprecruiter')) info = scrapeZipRecruiter();
    else if (host.includes('monster.')) info = scrapeMonster();
    else if (host.includes('flexjobs.')) info = scrapeFlexJobs();
    else if (host.includes('reed.')) info = scrapeReed();
    else if (host.includes('totaljobs')) info = scrapeTotaljobs();
    else info = genericScrape();
    return {
      job_title: (info.job_title || '').trim().slice(0, 200),
      company_name: (info.company_name || '').trim().slice(0, 100),
      job_description: (info.job_description || '').trim().slice(0, 3000)
    };
  }

  window.jobScraper = { getJobInfo };
})();
