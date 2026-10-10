import { GroupListView } from "@/components/groups/group-list-view";
import { PageHeader } from "@/components/ui";

export default function StudyGroupsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow=""
        title="Study Groups"
      />
      <GroupListView />
    </div>
  );
}
