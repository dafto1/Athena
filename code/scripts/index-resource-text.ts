import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const [{ prisma }, { extractResourceText }] = await Promise.all([
    import("../lib/prisma"),
    import("../lib/resource-text"),
  ]);
  try {
    const resources = await prisma.resource.findMany({ where: { extractedText: null }, select: { id: true, fileName: true, fileType: true, fileData: true } });
    let indexed = 0;
    let missingFiles = 0;
    for (const resource of resources) {
      if (!resource.fileData) {
        missingFiles += 1;
        console.warn(`Skipped ${resource.fileName}: file data is missing.`);
        continue;
      }
      const extractedText = await extractResourceText(resource.fileName, resource.fileType, Buffer.from(resource.fileData));
      await prisma.resource.update({ where: { id: resource.id }, data: { extractedText } });
      if (extractedText) indexed += 1;
    }
    console.log(`Processed ${resources.length} resource(s); extracted text for ${indexed}, skipped ${missingFiles} with missing file data.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Could not index existing resources:", error);
  process.exitCode = 1;
});
