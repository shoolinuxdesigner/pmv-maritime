import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Converts various Google Drive / Docs / Sheets sharing links
 * into direct download links so files download immediately instead
 * of opening the web preview viewer.
 */
export function getDirectDownloadUrl(url) {
  if (!url || typeof url !== "string") return "/docs/services.pdf";
  const trimmed = url.trim();

  // 1. Google Drive file pattern: /file/d/<FILE_ID>
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.usercontent.google.com/download?id=${fileIdMatch[1]}&export=download`;
  }

  // 2. Google Drive open?id=<FILE_ID> or uc?id=<FILE_ID>
  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1] && (trimmed.includes("drive.google.com") || trimmed.includes("google.com"))) {
    return `https://drive.usercontent.google.com/download?id=${idQueryMatch[1]}&export=download`;
  }

  // 3. Google Docs document: /document/d/<DOC_ID>
  const docMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch && docMatch[1]) {
    return `https://docs.google.com/document/d/${docMatch[1]}/export?format=pdf`;
  }

  // 4. Google Sheets: /spreadsheets/d/<SHEET_ID>
  const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch && sheetMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=pdf`;
  }

  return trimmed;
}
