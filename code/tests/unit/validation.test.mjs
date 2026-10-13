import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { annotationBulkSchema, annotationSchema, annotationUpdateSchema } from "../../lib/validations/annotation.ts";
import { loginSchema, registerSchema } from "../../lib/validations/auth.ts";
import { createFolderSchema, createGroupSchema, joinGroupSchema, shareResourceSchema } from "../../lib/validations/group.ts";
import { resourceRenameSchema } from "../../lib/validations/resource.ts";
import { taskSchema, taskUpdateSchema } from "../../lib/validations/task.ts";

describe("authentication validation", () => {
  it("normalizes valid registration fields", () => {
    assert.deepEqual(registerSchema.parse({ name: "  Ada Lovelace ", email: " ADA@EXAMPLE.COM ", password: "12345678" }), {
      name: "Ada Lovelace", email: "ada@example.com", password: "12345678",
    });
  });

  it("rejects invalid names, email, and password boundaries", () => {
    for (const input of [
      { name: "A", email: "ada@example.com", password: "12345678" },
      { name: "Ada", email: "not-an-email", password: "12345678" },
      { name: "Ada", email: "ada@example.com", password: "1234567" },
      { name: "Ada", email: "ada@example.com", password: "x".repeat(73) },
    ]) assert.equal(registerSchema.safeParse(input).success, false);
  });

  it("normalizes login email and rejects empty credentials", () => {
    assert.equal(loginSchema.parse({ email: " ADA@EXAMPLE.COM ", password: "x" }).email, "ada@example.com");
    assert.equal(loginSchema.safeParse({ email: "bad", password: "x" }).success, false);
    assert.equal(loginSchema.safeParse({ email: "ada@example.com", password: "" }).success, false);
  });
});

describe("task validation", () => {
  it("trims text and applies the default priority", () => {
    const task = taskSchema.parse({ title: "  Read chapter  ", description: "  Notes  " });
    assert.equal(task.title, "Read chapter");
    assert.equal(task.description, "Notes");
    assert.equal(task.priority, "MEDIUM");
  });

  it("accepts valid due dates and all priorities", () => {
    for (const priority of ["LOW", "MEDIUM", "HIGH"]) {
      assert.equal(taskSchema.safeParse({ title: "Study", dueDate: "2026-10-11T10:00:00.000Z", priority }).success, true);
    }
  });

  it("rejects empty or oversized titles, invalid dates, and unknown priorities", () => {
    for (const input of [
      { title: "   " },
      { title: "t".repeat(121) },
      { title: "Study", dueDate: "tomorrow" },
      { title: "Study", priority: "URGENT" },
    ]) assert.equal(taskSchema.safeParse(input).success, false);
  });

  it("allows valid partial updates and rejects invalid update types", () => {
    assert.equal(taskUpdateSchema.safeParse({}).success, true);
    assert.equal(taskUpdateSchema.safeParse({ completed: true, title: " Updated " }).success, true);
    assert.equal(taskUpdateSchema.safeParse({ completed: "true" }).success, false);
    assert.equal(taskUpdateSchema.safeParse({ title: "  " }).success, false);
  });
});

describe("resource validation", () => {
  it("trims a valid title and optional category", () => {
    assert.deepEqual(resourceRenameSchema.parse({ title: " Notes ", category: " Class " }), { title: "Notes", category: "Class" });
    assert.deepEqual(resourceRenameSchema.parse({ title: "Notes" }), { title: "Notes" });
  });

  it("rejects blank and over-limit values", () => {
    assert.equal(resourceRenameSchema.safeParse({ title: " " }).success, false);
    assert.equal(resourceRenameSchema.safeParse({ title: "x".repeat(121) }).success, false);
    assert.equal(resourceRenameSchema.safeParse({ title: "Notes", category: "c".repeat(51) }).success, false);
  });
});

describe("study group validation", () => {
  it("trims group and folder names and normalizes invite codes", () => {
    assert.equal(createGroupSchema.parse({ name: "  OS Study  " }).name, "OS Study");
    assert.equal(createFolderSchema.parse({ name: "  Week 1 " }).name, "Week 1");
    assert.equal(joinGroupSchema.parse({ inviteCode: " ab12cd " }).inviteCode, "AB12CD");
  });

  it("enforces name, invite, description, and resource reference constraints", () => {
    assert.equal(createGroupSchema.safeParse({ name: " " }).success, false);
    assert.equal(createGroupSchema.safeParse({ name: "x".repeat(61) }).success, false);
    assert.equal(createGroupSchema.safeParse({ name: "Study", description: "x".repeat(201) }).success, false);
    assert.equal(createFolderSchema.safeParse({ name: "x".repeat(41) }).success, false);
    assert.equal(joinGroupSchema.safeParse({ inviteCode: "abc" }).success, false);
    assert.equal(joinGroupSchema.safeParse({ inviteCode: "x".repeat(21) }).success, false);
    assert.equal(shareResourceSchema.safeParse({ resourceId: "resource-1", folderId: null }).success, true);
    assert.equal(shareResourceSchema.safeParse({ resourceId: "" }).success, false);
  });
});

describe("PDF annotation validation", () => {
  const validAnnotation = {
    type: "HIGHLIGHT", pageNumber: 1, xPct: 0, yPct: 100, wPct: 50, hPct: 25,
  };

  it("applies the default color and accepts coordinate boundaries", () => {
    assert.equal(annotationSchema.parse(validAnnotation).color, "#facc15");
    assert.equal(annotationSchema.safeParse({ ...validAnnotation, color: "#a0B1c2" }).success, true);
  });

  it("rejects bad page numbers, types, colors, and out-of-range coordinates", () => {
    for (const input of [
      { ...validAnnotation, pageNumber: 0 },
      { ...validAnnotation, pageNumber: 1.5 },
      { ...validAnnotation, type: "COMMENT" },
      { ...validAnnotation, color: "red" },
      { ...validAnnotation, xPct: -0.1 },
      { ...validAnnotation, yPct: 100.1 },
    ]) assert.equal(annotationSchema.safeParse(input).success, false);
  });

  it("enforces bulk size and update content rules", () => {
    assert.equal(annotationBulkSchema.safeParse({ items: [validAnnotation] }).success, true);
    assert.equal(annotationBulkSchema.safeParse({ items: [] }).success, false);
    assert.equal(annotationBulkSchema.safeParse({ items: Array(51).fill(validAnnotation) }).success, false);
    assert.equal(annotationUpdateSchema.safeParse({ content: "  Note " }).success, true);
    assert.equal(annotationUpdateSchema.safeParse({ content: " " }).success, false);
    assert.equal(annotationUpdateSchema.safeParse({ color: "#123" }).success, false);
  });
});
