import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GroupDetailView } from "@/components/groups/group-detail-view";
import { ButtonLink } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

export default async function StudyGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex justify-start">
        <ButtonLink href="/dashboard/groups" variant="secondary" size="sm">
          <ArrowLeft className="h-4 w-4" />
          All Groups
        </ButtonLink>
      </div>

      <GroupDetailView groupId={id} currentUserId={user.id} />
    </div>
  );
}
