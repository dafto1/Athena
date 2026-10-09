const fs = require("fs");
const path = require("path");

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
}

try {
  const reactPdfDirectory = path.dirname(require.resolve("react-pdf/package.json"));
  const pdfjsDirectory = path.dirname(
    require.resolve("pdfjs-dist/package.json", { paths: [reactPdfDirectory] })
  );
  const dest = path.join(__dirname, "..", "public", "pdfjs");
  fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(
    path.join(pdfjsDirectory, "build", "pdf.worker.min.mjs"),
    path.join(dest, "pdf.worker.min.mjs")
  );
  for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
    copyDir(path.join(pdfjsDirectory, directory), path.join(dest, directory));
  }
  console.log("Copied PDF.js assets to public/pdfjs");
} catch (error) {
  console.warn("Could not copy PDF.js assets:", error.message);
}
