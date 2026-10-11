import "server-only";

const MAX_EXTRACTED_CHARS = 120_000;

/** Extracts searchable text from safe, supported resource types. */
export async function extractResourceText(fileName: string, fileType: string, data: Buffer) {
  const type = fileType.toLowerCase();
  const name = fileName.toLowerCase();
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) return data.toString("utf8").replace(/\0/g, "").slice(0, MAX_EXTRACTED_CHARS);
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
