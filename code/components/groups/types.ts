// Types for Study Group Collaboration (REQ-GROUP-001 - REQ-GROUP-010)

export type GroupRole = "ADMIN" | "MEMBER";

export type StudyGroupMember = {
  id: string;
  role: GroupRole;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type StudyGroupFolder = {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    resources: number;
  };
};

export type GroupResourceItem = {
  id: string;
  groupId: string;
  resourceId: string;
  sharedById: string;
  folderId: string | null;
  createdAt: string;
  resource: {
    id: string;
    title: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    category: string;
    userId: string;
  };
  sharedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  folder?: {
    id: string;
    name: string;
  } | null;
};

export type StudyGroup = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  role?: GroupRole;
  _count?: {
    members: number;
    resources: number;
  };
};

export type StudyGroupDetail = StudyGroup & {
  members: StudyGroupMember[];
  folders: StudyGroupFolder[];
  resources: GroupResourceItem[];
};
