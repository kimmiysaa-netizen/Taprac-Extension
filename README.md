# Taprac Browser Extension

Auto-fill job applications using your Taprac (Bubble.io) profile data.

## Features

- ✅ Works on **Chrome, Edge, Brave, Opera, and Firefox**
- ✅ Auto-fills forms across **8+ job boards** (LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster, FlexJobs, Reed, Totaljobs)
- ✅ **Bubble.io API integration** — pulls your profile, work experience, education, skills, and CV
- ✅ **Smart subscription check** — validates your Taprac subscription before allowing use
- ✅ **Cover letter generation** (via Bubble AI endpoint, with graceful fallback)
- ✅ **Application tracking** — logs all applications to your Taprac account
- ✅ **Multi-step form support** — handles complex job application workflows
- ✅ **CV auto-upload** — attempts to populate CV file fields programmatically

## Installation

### Chrome, Edge, Brave, Opera

1. **Unzip** the extension folder
2. Open your browser and navigate to the Extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the unzipped extension folder
6. Done! The extension is now active.

### Firefox (Temporary Loading)

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Select the `manifest.firefox.json` file (or any file in the folder)
4. The extension appears in your list

## Usage

1. Visit a job posting page on any supported job board
2. A purple **"Apply with Taprac"** button appears in the bottom-right corner
3. Click the button:
   - If not logged in → enter your Taprac email and password
   - If logged in → subscription check runs automatically
4. Once authenticated:
   - The sidebar opens showing the job title, company, and description
   - Click **"Auto-fill Form"** to populate form fields with your profile data
   - Click **"Generate"** to create an AI-generated cover letter
   - Edit the cover letter in the textarea if needed
   - Click **"Submit Application"** to submit the form
5. The extension logs your application to your Taprac account

## Supported Job Boards

- **LinkedIn** — linkedin.com
- **Indeed** — indeed.com
- **Glassdoor** — glassdoor.com
- **ZipRecruiter** — ziprecruiter.com
- **Monster** — monster.com
- **FlexJobs** — flexjobs.com
- **Reed** — reed.co.uk
- **Totaljobs** — totaljobs.com
- **Generic sites** — uses schema.org JobPosting metadata

## Troubleshooting

### Extension not showing the Apply button
- Ensure you're on a job posting page (not job search results)
- Refresh the page
- Check that the extension is enabled in your Extensions page

### Auto-fill not working
- Not all job sites have consistently named form fields
- The extension uses heuristics; if field names are unique, you may need to manually fill some fields
- Check your browser console (F12) for errors

### Cover letter generation unavailable
- The `/wf/generate-cover-letter-secure` endpoint may not be live in your Bubble app yet
- You can still manually paste a cover letter in the sidebar textarea

### File upload not working
- Browser security policies may prevent programmatic file uploads on some sites
- The extension will attempt to upload your CV file automatically; if it fails, upload manually

## Configuration

The extension connects to your Bubble.io backend. The API URL is configured in `config.js`:

```javascript
const TAPRAC_BASE_URL = "https://kimmiysaa.bubbleapps.io/version-test/api/1.1";
```

## Files

- `manifest.json` — Chromium MV3 manifest
- `manifest.firefox.json` — Firefox MV2-compatible manifest
- `content.js` — Main extension logic
- `background.js` — Service worker
- `job-scraper.js` — Job data extraction
- `form-filler.js` — Form field detection and auto-fill
- `sidebar.html / sidebar.css` — Sidebar UI
- `login-popup.html / login-popup.css` — Login popup UI
- `config.js` — Configuration constants
- `browser-polyfill.js` — Firefox compatibility shim
- `icons/` — Extension icons

## License

Proprietary — Taprac
