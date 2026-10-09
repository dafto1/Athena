export function isPdfFile(fileType: string, fileName: string) {
  return (
    fileType.toLowerCase().includes("pdf") ||
    fileName.toLowerCase().endsWith(".pdf")
  );
}
