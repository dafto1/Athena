import { prisma } from "@/lib/prisma";

export function getOwnedResource(userId: string, resourceId: string) {
  return prisma.resource.findFirst({
    where: { id: resourceId, userId },
  });
}
