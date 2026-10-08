// Orchestrator for study groups overview page (REQ-GROUP-001 - REQ-GROUP-004)
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Input } from "@/components/ui";
import { Users, Plus, KeyRound, Search } from "lucide-react";
import { GroupCard } from "./group-card";
import { CreateGroupModal } from "./create-group-modal";
import { JoinGroupModal } from "./join-group-modal";
import type { StudyGroup } from "./types";

export function GroupListView() {
  const router = useRouter();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [, startTransition] = useTransition();

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  const filtered = groups.filter((g) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return g.name.toLowerCase().includes(term) || (g.description && g.description.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search study groups…"
            value={search}
            onChange={(e) => startTransition(() => setSearch(e.target.value))}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowJoin(true)}>
            <KeyRound className="h-4 w-4" />
            Join with Code
          </Button>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Create Study Group
          </Button>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No matching study groups" : "No study groups yet"}
          description={
            search
              ? "Try adjusting your search terms."
              : "Form a study group with classmates or enter an invite code to join an existing group."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(newId) => {
            fetchGroups();
            router.push(`/dashboard/groups/${newId}`);
          }}
        />
      )}

      {showJoin && (
        <JoinGroupModal
          onClose={() => setShowJoin(false)}
          onJoined={(joinedId) => {
            fetchGroups();
            router.push(`/dashboard/groups/${joinedId}`);
          }}
        />
      )}
    </div>
  );
}
