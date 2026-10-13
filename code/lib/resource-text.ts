import JSZip from "jszip";

const MAX_EXTRACTED_CHARS = 120_000;

function decodeXmlText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function extractXmlText(xml: string, tag: "w:t" | "a:t") {
  return [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "g"))]
    .map((match) => decodeXmlText(match[1]))
    .join(" ");
}

async function extractOfficeText(data: Buffer, kind: "docx" | "pptx") {
  const zip = await JSZip.loadAsync(data);
  const paths = kind === "docx"
    ? ["word/document.xml", "word/footnotes.xml", "word/endnotes.xml", "word/header1.xml", "word/footer1.xml"]
    : Object.keys(zip.files)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
      .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));
  const tag = kind === "docx" ? "w:t" : "a:t";
  const parts: string[] = [];
  let size = 0;
  for (const path of paths) {
    const file = zip.file(path);
    if (!file) continue;
    const text = extractXmlText(await file.async("string"), tag).trim();
    if (!text) continue;
    parts.push(text);
    size += text.length;
    if (size >= MAX_EXTRACTED_CHARS) break;
  }
  return parts.join("\n\n").slice(0, MAX_EXTRACTED_CHARS) || null;
}

/** Extracts searchable text from safe, supported resource types. */
export async function extractResourceText(fileName: string, fileType: string, data: Buffer) {
  const type = fileType.toLowerCase();
  const name = fileName.toLowerCase();
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) return data.toString("utf8").replace(/\0/g, "").slice(0, MAX_EXTRACTED_CHARS);
  if (name.endsWith(".docx") || type.includes("wordprocessingml.document")) {
    try { return await extractOfficeText(data, "docx"); }
    catch (error) { console.warn(`Could not extract text from ${fileName}:`, error); return null; }
  }
  if (name.endsWith(".pptx") || type.includes("presentationml.presentation")) {
    try { return await extractOfficeText(data, "pptx"); }
    catch (error) { console.warn(`Could not extract text from ${fileName}:`, error); return null; }
  }
  if (!(type.includes("pdf") || name.endsWith(".pdf"))) return null;
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data), useWorkerFetch: false });
    try {
      const document = await loadingTask.promise;
      const pages: string[] = [];
      let size = 0;
      for (let number = 1; number <= document.numPages && size < MAX_EXTRACTED_CHARS; number += 1) {
        const page = await document.getPage(number);
        const content = await page.getTextContent();
        const text = content.items.map((item) => "str" in item ? item.str : "").join(" ");
        pages.push(text);
        size += text.length;
      }
      return pages.join("\n\n").slice(0, MAX_EXTRACTED_CHARS) || null;
    } finally {
      await loadingTask.destroy().catch(() => {});
    }
  } catch (error) {
    console.warn(`Could not extract text from ${fileName}:`, error);
    return null;
  }
}
