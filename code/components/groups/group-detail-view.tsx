// Orchestrator for study group workspace view (REQ-GROUP-004 - REQ-GROUP-010)
"use client";

import { useEffect, useState, useTransition } from "react";
import { EmptyState, IconButton } from "@/components/ui";
import { Copy, Check, FolderOpen } from "lucide-react";
import { GroupFoldersBar } from "./group-folders-bar";
import { GroupResourceCard } from "./group-resource-card";
import { ShareResourceModal } from "./share-resource-modal";
import { GroupMemberListModal } from "./group-member-list";
import type { StudyGroupDetail } from "./types";

export function GroupDetailView({
  groupId,
  currentUserId,
}: {
  groupId: string;
  currentUserId: string;
}) {
  const [group, setGroup] = useState<StudyGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  async function fetchGroup() {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  function copyInvite() {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (!group) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Group not found"
        description="You might not be a member or this study group was deleted."
      />
    );
  }

  const displayedResources = group.resources.filter((item) => {
    if (selectedFolderId === "all") return true;
    return item.folderId === selectedFolderId;
  });

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Study Group: {group.name}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Invite Code Badge */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-700 shadow-sm">
            <span>Invite: <strong>{group.inviteCode}</strong></span>
            <IconButton label="Copy invite code" onClick={copyInvite} className="p-0.5">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </IconButton>
          </div>

        </div>
      </div>

      {/* Folders Navigation (REQ-GROUP-008) */}
      <GroupFoldersBar
        folders={group.folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={(id) => startTransition(() => setSelectedFolderId(id))}
        memberCount={group.members.length}
        onMembers={() => setShowMembersModal(true)}
        onShare={() => setShowShareModal(true)}
      />

      {/* Shared Resources Grid */}
      {displayedResources.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={selectedFolderId === "all" ? "No shared resources yet" : "This folder is empty"}
          description="Share lecture notes, problem sets, or study materials with group members."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedResources.map((item) => (
            <GroupResourceCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              userRole={group.role}
              onRemoved={fetchGroup}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showShareModal && (
        <ShareResourceModal
          groupId={group.id}
          folders={group.folders}
          onClose={() => setShowShareModal(false)}
          onShared={fetchGroup}
        />
      )}

      {showMembersModal && (
        <GroupMemberListModal
          members={group.members}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </div>
  );
}
