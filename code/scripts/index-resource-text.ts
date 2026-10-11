import { prisma } from "../lib/prisma";
import { extractResourceText } from "../lib/resource-text";

async function main() {
  const resources = await prisma.resource.findMany({ where: { extractedText: null }, select: { id: true, fileName: true, fileType: true, fileData: true } });
  for (const resource of resources) {
    const extractedText = await extractResourceText(resource.fileName, resource.fileType, Buffer.from(resource.fileData));
    await prisma.resource.update({ where: { id: resource.id }, data: { extractedText } });
  }
  console.log(`Indexed ${resources.length} resource(s).`);
}

main().finally(() => prisma.$disconnect());
