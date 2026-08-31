# Workspace Rule: Always Build & Patch .NET Portal

After fixing any bug or modifying component code in `member-upload`, always run `npm run build` (which executes `vite build && node scripts/copy-to-portal.js`) to ensure latest bundle JS & CSS assets are deployed directly to the .NET portal at `c:/ALL/OFFICE/mayfairmemberportal/Site`.
