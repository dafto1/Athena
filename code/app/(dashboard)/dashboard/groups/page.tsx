import { GroupListView } from "@/components/groups/group-list-view";
import { PageHeader } from "@/components/ui";

export default function StudyGroupsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Collaboration"
        title="Study Groups"
        description="Collaborate with peers, organize shared folders, and share course study materials."
      />
      <GroupListView />
    </div>
  );
}
