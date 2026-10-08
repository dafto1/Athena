import { notFound, redirect } from "next/navigation";
import { FileWarning } from "lucide-react";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { PdfWorkspace } from "@/components/pdf-viewer/pdf-workspace";
import { getCurrentUser } from "@/lib/auth";
import { isPdfFile } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { getOwnedResource } from "@/lib/resources";

export default async function ResourcePdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const resource = await getOwnedResource(user.id, id);
  if (!resource) notFound();

  if (!isPdfFile(resource.fileType, resource.fileName)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="PDF viewer"
          title={resource.title}
          description="Only PDF files can be opened in the in-app reader."
        />
        <Card>
          <EmptyState
            icon={FileWarning}
            title="This file cannot be opened as a PDF"
            description="Choose a PDF from your resources, or download this file instead."
          />
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/dashboard/resources" variant="secondary">
              Back to resources
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const annotations = await prisma.annotation.findMany({
    where: { resourceId: resource.id, userId: user.id },
    orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
  });

  return (
    <PdfWorkspace
      resourceId={resource.id}
      title={resource.title}
      fileUrl={resource.fileUrl}
      initialAnnotations={annotations.map((item) => ({
        id: item.id,
        persisted: true,
        type: item.type,
        pageNumber: item.pageNumber,
        content: item.content,
        color: item.color,
        xPct: item.xPct,
        yPct: item.yPct,
        wPct: item.wPct,
        hPct: item.hPct,
      }))}
    />
  );
}
