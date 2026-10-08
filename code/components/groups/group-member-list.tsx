// Study group member roster modal (REQ-GROUP-004)
"use client";

import { Badge, Modal } from "@/components/ui";
import { User, Shield } from "lucide-react";
import type { StudyGroupMember } from "./types";

export function GroupMemberListModal({
  members,
  onClose,
}: {
  members: StudyGroupMember[];
  onClose: () => void;
}) {
  return (
    <Modal title={`Group Members (${members.length})`} onClose={onClose}>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                {member.role === "ADMIN" ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {member.user.name || "Student"}
                </p>
                <p className="text-xs text-slate-500">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={member.role === "ADMIN" ? "violet" : "slate"}>
                {member.role === "ADMIN" ? "Admin" : "Member"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
