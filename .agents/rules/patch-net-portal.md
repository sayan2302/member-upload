# Workspace Rules & Operating Instructions for Member Upload

## 1. Multi-Repository Reference
- **Frontend**: `c:\ALL\OFFICE\New Web Component\member-upload`
- **Backend API**: `c:\ALL\OFFICE\data-exchange` (check for API routes, payload formats, AWS S3/Dynamo logic, and validation engines)
- **Host .NET Portal**: `c:\ALL\OFFICE\mayfairmemberportal` (check for Razor views, user context extraction, and layout CSS resets)

## 2. Mandatory Build & Patch Rule (CRITICAL)
After **every** change or fix in `member-upload`, you MUST run:
```bash
npm run build
```
This compiles the Vite bundle and executes `scripts/copy-to-portal.js` to automatically copy:
- `dist/memberUpload.js` $\rightarrow$ `c:\ALL\OFFICE\mayfairmemberportal\Site\js\react-dist\memberUpload.js`
- `dist/css/memberUpload.css` $\rightarrow$ `c:\ALL\OFFICE\mayfairmemberportal\Site\css\react-dist\member-upload.css`

## 3. UI, Tooltips & CSS Defense
- **NEVER use native browser tooltips (`title="..."`)**. Always use custom glassmorphic tooltips (`.broker-tooltip`) wrapped in `.broker-icon-btn-wrap` with `.tooltip-title` and `.tooltip-desc`.
- Action buttons in strips must have explicit `gap: 8px !important;`.
- Avoid semantic `<header>` tags for top bars (as the ASP.NET portal applies `header { margin: 0; }`); use `<div>` tags with `!important` margins (`margin-bottom: 24px !important;`).

## 4. Fullscreen & Modals (React Portals)
- When opening modals or fullscreen views, always render via `createPortal(jsx, document.body)` with `z-index: 2147483647 !important;` so host portal sidebars never clip the content.
- Lock background scrolling using `document.body.style.overflow = 'hidden'` while open, and restore it on close/<kbd>Esc</kbd>.

## 5. Excel Date Parsing & Formatting
- Convert Excel serial dates (e.g. `38936`) to `YYYY-MM-DD` using `excelSerialToDateString(num)` (`1899-12-30` epoch).
- Strip ISO timestamp suffixes (`T00:00:00.000Z` or space timestamps) to output clean `YYYY-MM-DD`.
- When users download templates in `downloadTemplate()`, use `ExcelJS` to enforce `col.numFmt = 'yyyy-mm-dd'`.

## 6. Uploader Information & Data Integrity
- Never suppress or blank out uploader names/emails (even if matching `system`, `hr.admin@mayfair.com`, `lawton_asia`, or `hr@company.com`).
- `getUploaderInfo` must check all REST/S3 property aliases (`uploadedByName`, `uploaded_by_name`, `uploadedBy`, `uploadedByEmail`, `user_email`, `created_by`, `actor_name`, `actor_email`).

## 7. Pagination & Query Limits
- Always append `limit=500` and `max_results=500` to `/uploads3/history` requests so results are not capped at 50 rows.
- Header count badges must display actual total server count when viewing all submissions.

