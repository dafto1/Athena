import { ResourceManager } from "@/components/resources/resource-manager";
import { PageHeader } from "@/components/ui";

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow=""
        title="Resources"
      />
      <ResourceManager />
    </div>
  );
}
