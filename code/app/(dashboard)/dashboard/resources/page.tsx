import { ResourceManager } from "@/components/resources/resource-manager";
import { PageHeader } from "@/components/ui";

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Academic Library"
        title="Resource Management"
        description="Centralized storage to organize, categorize, and access all your study materials."
      />
      <ResourceManager />
    </div>
  );
}
