import { prisma } from "@/lib/prisma";

export function getOwnedResource(userId: string, resourceId: string) {
  return prisma.resource.findFirst({
    where: { id: resourceId, userId },
  });
}

/** REQ-GROUP-006 / REQ-GROUP-007: Resource is accessible if owned OR shared with a group user is in */
export function getAccessibleResource(userId: string, resourceId: string) {
  return prisma.resource.findFirst({
    where: {
      id: resourceId,
      OR: [
        { userId },
        {
          groupShares: {
            some: {
              group: {
                members: {
                  some: { userId },
                },
              },
            },
          },
        },
      ],
    },
  });
}
