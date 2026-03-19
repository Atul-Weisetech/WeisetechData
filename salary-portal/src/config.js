// Empty string = relative URL (/api/...)
// Dev: vite.config.js proxy forwards /api/* → Render backend
// Prod: vercel.json rewrite forwards /api/* → Render backend
const API_BASE = "";

export default API_BASE;
