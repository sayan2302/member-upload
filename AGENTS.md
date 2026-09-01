# Antigravity Agent Rules & Technical Operating Instructions

> **Repository**: `member-upload` (`c:\ALL\OFFICE\New Web Component\member-upload`)  
> **Backend Service**: `data-exchange` (`c:\ALL\OFFICE\data-exchange`)  
> **Legacy Host Portal**: `mayfairmemberportal` (`c:\ALL\OFFICE\mayfairmemberportal`)  
> **Primary Technology Stack**: React 18, Vite, Vanilla CSS, ExcelJS, ASP.NET MVC / Razor

---

## 1. Multi-Repository Architecture & Ecosystem Navigation

When working on any task, feature, or bug in this workspace, always cross-reference and inspect the relevant interconnected repositories:

1. **Frontend Component Workspace** (`c:\ALL\OFFICE\New Web Component\member-upload`):
   - Standalone Vite + React application providing the **Interactive Member Upload**, **Validation Worksheet Preview**, **Broker Dashboard**, **Upload History**, and **Time-Travel File Audit Console**.
2. **Backend API Service** (`c:\ALL\OFFICE\data-exchange`):
   - Node.js / Express / AWS SDK backend handling S3 file persistence, DynamoDB/RDS metadata, asynchronous validation queues, Excel parsing, and audit subtransactions (`/uploads3`, `/uploads3/history`, `/uploads3/audit`, `/enrolment-meta`).
   - Check this repo whenever investigating API contracts, route parameters, response payloads, or validation rules.
3. **Legacy Host Portal** (`c:\ALL\OFFICE\mayfairmemberportal`):
   - ASP.NET MVC (.NET Framework) web application hosting the React bundle on Razor views (e.g. `Site/Views/HRHome/BulkMemberPolicyUpload.cshtml` and `Site/Views/BrokerHome/MemberDataUpload.cshtml`).
   - Check this repo when inspecting user session contexts (`UserContext.Current`, `userEmail`, `userId`), Razor mounting wrappers (`#member-upload-root`), and global layout CSS resets.

---

## 2. Mandatory Build & Deployment Protocol (CRITICAL)

**Rule: After EVERY change made to `member-upload`, you MUST compile and patch the build assets to the .NET portal.**

```bash
# In c:\ALL\OFFICE\New Web Component\member-upload
npm run build
```

- `npm run build` executes `vite build && node scripts/copy-to-portal.js`.
- It copies:
  - `dist/memberUpload.js` $\rightarrow$ `c:\ALL\OFFICE\mayfairmemberportal\Site\js\react-dist\memberUpload.js`
  - `dist/css/memberUpload.css` $\rightarrow$ `c:\ALL\OFFICE\mayfairmemberportal\Site\css\react-dist\member-upload.css`
- **Never consider a task complete without running `npm run build` and verifying that the command exited with code 0.**

---

## 3. UI, Design System & Tooltip Rules

1. **NEVER Use Native Browser Tooltips (`title="..."`)**:
   - Always use custom glassmorphic tooltips (`.broker-tooltip`) wrapped in a relative container (`.broker-icon-btn-wrap` or `.toolbar-btn-wrap`).
   - Required tooltip markup structure:
     ```jsx
     <div className="broker-icon-btn-wrap">
       <button type="button" className="toolbar-btn" aria-label="Action Description">
         <IconComponent size={14} />
       </button>
       <div className="broker-tooltip">
         <span className="tooltip-title">Title</span>
         <span className="tooltip-desc">Secondary descriptive subtitle</span>
       </div>
     </div>
     ```
2. **Action Button Styling & Spacing**:
   - Buttons in toolbar strips (`.toolbar-actions-strip`) must always have explicit `gap: 8px !important;` to prevent adjacent borders from collapsing or touching.
   - Use icon-only buttons for compact toolbars with appropriate accessible `aria-label` attributes.
   - Action buttons must maintain a minimum touch target / standard size (`28px` to `32px`).
3. **Defense Against ASP.NET Host CSS Overrides**:
   - The .NET portal has global HTML tag resets (e.g., `header { margin: 0; }`).
   - **Do NOT use semantic `<header>` tags for top bars**; use `<div className="audit-header-bar">` or similar containers.
   - Enforce explicit `!important` margins (`margin-bottom: 24px !important;`, `margin-top: 24px !important;`) on top-level layout sections.

---

## 4. Fullscreen & Modal Layering (React Portals)

1. **Always Use `createPortal(node, document.body)` for Fullscreen & Modals**:
   - In the ASP.NET portal, parent container elements often have `transform`, `filter`, or `contain` CSS rules that create new stacking contexts.
   - If a fullscreen panel or modal remains inside the parent component tree, host portal sidebars (which sit at root `<body>` level) will render on top and clip the component.
   - When fullscreen mode is active (`isFullscreen` or `isInspectorFullscreen`), always portal the element to `document.body`:
     ```jsx
     if (isFullscreen && typeof document !== 'undefined') {
       return createPortal(modalOrPanelNode, document.body);
     }
     ```
2. **Maximum Layering (`z-index`)**:
   - Fullscreen overlays must specify `z-index: 2147483647 !important;` (the maximum allowed 32-bit signed integer in CSS).
3. **Background Body Scroll Lock**:
   - Whenever a fullscreen view or modal opens, lock background scrolling:
     ```javascript
     document.body.style.overflow = 'hidden';
     ```
   - Restore `document.body.style.overflow = ''` when closing or on unmount.
   - Always support closing fullscreen/modals via the <kbd>Escape</kbd> key.

---

## 5. Excel Date Parsing & Formatting Standards

1. **Excel Serial Date Conversion**:
   - Excel internally stores dates as serial numbers (e.g., `38936` for `2006-08-07`).
   - When reading Excel cells in `excelParser.js` or rendering cells in tables, always convert serial numbers to dates using `excelSerialToDateString(num)`:
     - Epoch: `1899-12-30` (`Math.floor(num - 25569) * 86400 * 1000`).
2. **ISO Timestamp Stripping**:
   - When dates are represented as ISO timestamps (e.g., `2006-08-07T00:00:00.000Z` or `2001-01-02 00:00:00`), always strip the time component via regex `/^\d{4}-\d{2}-\d{2}[T\s]/` to output clean **`YYYY-MM-DD`**.
3. **Cell Display Helper (`formatCellDisplayValue`)**:
   - All table cells in date-bearing columns (`DOB`, `Original entry date`, `Effective`, `Expiry`, `Date of Birth`, `Birth Date`) must be passed through `formatCellDisplayValue(value, columnName)`.
4. **Template Download Date Rule Enforcement**:
   - When generating or downloading template workbooks in `downloadTemplate()`, use `ExcelJS` to set `col.numFmt = 'yyyy-mm-dd'` across all date columns so Excel automatically enforces `YYYY-MM-DD` formatting.

---

## 6. Uploader Information & Data Integrity (Zero Suppression)

1. **Do NOT Suppress Real User Information**:
   - Never replace valid usernames or emails with dashes (`—`) just because they contain keywords like `system`, `hr.admin@mayfair.com`, `lawton_asia`, or `hr@company.com`.
   - Never fabricate placeholder names; always reflect actual uploader data returned from the API.
2. **Comprehensive Key Resolution**:
   - `getUploaderInfo(item)` must inspect all possible REST/S3/DB property aliases:
     - **Name**: `uploadedByName`, `uploaded_by_name`, `uploadedBy`, `uploaded_by`, `uploaderName`, `created_by_name`, `created_by`, `actor_name`, `user_name`, `name`
     - **Email**: `uploadedByEmail`, `uploaded_by_email`, `uploaderEmail`, `uploader_email`, `created_by_email`, `actor_email`, `user_email`, `email`
   - If only an email address is available (e.g. `sayan.pramanick@mayfair.com`), format the username part cleanly (e.g. `Sayan Pramanick`).

---

## 7. History & Dashboard Pagination Rules

1. **Explicit API Limits**:
   - When fetching upload history (`/uploads3/history`), always append high query limits (`params.append('limit', '500')`, `params.append('max_results', '500')`).
   - Never rely on backend defaults, which may cap results at 50 rows.
2. **Dynamic Header Count Badges**:
   - Display total server count (`data.total`, `data.total_count`, `data.count`) when viewing all submissions.
   - Display filtered record count (`filteredItems.length`) when search queries, status filters, or date range filters are active.

---

## 8. Time-Travel File Audit Console Standards

1. **Single Source of Truth**:
   - `FileAuditConsole.jsx` renders the comprehensive lifecycle of an uploaded file across all cycles, verification steps, broker overrides, and rejections.
2. **Timeline Visuals**:
   - Keep cycle cards, step pills, actor cards, and rejection callout boxes cleanly aligned.
   - Do NOT display redundant error hint tags underneath timeline sub-steps if errors are already highlighted in the inspector panel.
3. **Snapshot & Base Worksheet Fallback**:
   - When rendering historical snapshots, support both full row snapshots and base worksheet fallbacks for legacy files without snapshot persistence.

---

## 9. Verification & Code Quality Checklist

Before completing any task:
- [ ] Run `npm run build` and ensure zero compilation errors.
- [ ] Verify that `scripts/copy-to-portal.js` successfully updated `memberUpload.js` and `member-upload.css` in `mayfairmemberportal`.
- [ ] Ensure all interactive buttons have custom `.broker-tooltip` elements with no native `title="..."` attributes.
- [ ] Ensure any modal or fullscreen view uses `createPortal` to `document.body` with maximum `z-index`.
- [ ] Ensure date values render as clean `YYYY-MM-DD` without raw serial numbers or `T00:00:00.000Z` timestamps.
- [ ] Ensure uploader names and emails are cleanly resolved and displayed.
