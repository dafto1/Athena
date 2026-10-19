import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent, type CalendarProvider } from "@/lib/calendar";

type AgentResult = { answer: string; activities: { tool: string; detail: string }[]; timerMinutes?: number };

const today = () => new Date().toISOString();
const safeJson = (value: unknown) => JSON.stringify(value, null, 2);

function rankText(query: string, text: string) {
  const words = query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  const lower = text.toLowerCase();
  return words.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
}

function model() {
  if (process.env.GOOGLE_API_KEY) return new ChatGoogleGenerativeAI({ model: process.env.GOOGLE_MODEL ?? "gemini-2.5-flash", apiKey: process.env.GOOGLE_API_KEY, temperature: 0.2 });
  if (process.env.OPENROUTER_API_KEY) return new ChatOpenAI({ model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash", apiKey: process.env.OPENROUTER_API_KEY, configuration: { baseURL: "https://openrouter.ai/api/v1", defaultHeaders: { "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000", "X-Title": "Athena Nemo" } }, temperature: 0.2 });
  return null;
}

/** Runs Nemo with per-user tools; no resource data is ever shared across users. */
export async function runNemo(userId: string, message: string): Promise<AgentResult> {
  const activities: AgentResult["activities"] = [];
  let timerMinutes: number | undefined;
  const tools = [
    new DynamicStructuredTool({ name: "search_resources", description: "Search the user's uploaded study documents. Use this before answering questions about their material.", schema: z.object({ query: z.string().min(2).max(300) }), func: async ({ query }) => {
      const resources = await prisma.resource.findMany({ where: { userId, extractedText: { not: null } }, select: { id: true, title: true, fileName: true, extractedText: true }, take: 40 });
      const matches = resources.map((resource) => ({ ...resource, score: rankText(query, `${resource.title} ${resource.extractedText ?? ""}`) })).filter((resource) => resource.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map(({ id, title, fileName, extractedText }) => {
        const text = extractedText ?? ""; const needle = query.split(/\s+/).find((word) => word.length > 2) ?? "";
        const at = Math.max(0, text.toLowerCase().indexOf(needle.toLowerCase()));
        return { id, title, fileName, excerpt: text.slice(Math.max(0, at - 250), at + 850) };
      });
      activities.push({ tool: "Resources searched", detail: matches.length ? `${matches.length} relevant document${matches.length === 1 ? "" : "s"} found` : "No matching indexed documents" });
      return safeJson(matches);
    }}),
    new DynamicStructuredTool({ name: "list_tasks", description: "List the user's tasks when needed to identify a task before changing it.", schema: z.object({ includeCompleted: z.boolean().default(false) }), func: async ({ includeCompleted }) => {
      const tasks = await prisma.task.findMany({ where: { userId, ...(includeCompleted ? {} : { completed: false }) }, select: { id: true, title: true, description: true, dueDate: true, priority: true, completed: true }, orderBy: { createdAt: "desc" }, take: 50 });
      activities.push({ tool: "Tasks checked", detail: `${tasks.length} task${tasks.length === 1 ? "" : "s"} available` }); return safeJson(tasks);
    }}),
    new DynamicStructuredTool({ name: "create_task", description: "Create a task when the user asks to add a todo.", schema: z.object({ title: z.string().min(1).max(120), description: z.string().max(1000).optional(), dueDate: z.string().datetime().optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM") }), func: async (input) => {
      const task = await prisma.task.create({ data: { ...input, description: input.description ?? null, dueDate: input.dueDate ? new Date(input.dueDate) : null, userId } }); activities.push({ tool: "Task created", detail: task.title }); return safeJson({ id: task.id, title: task.title });
    }}),
    new DynamicStructuredTool({ name: "update_task", description: "Update, complete, or rename a task. Always use list_tasks first when the ID is unknown.", schema: z.object({ id: z.string(), title: z.string().min(1).max(120).optional(), description: z.string().max(1000).nullable().optional(), dueDate: z.string().datetime().nullable().optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(), completed: z.boolean().optional() }), func: async ({ id, dueDate, completed, ...input }) => {
      const task = await prisma.task.findFirst({ where: { id, userId } }); if (!task) return "Task not found.";
      const updated = await prisma.task.update({ where: { id }, data: { ...input, dueDate: dueDate === undefined ? undefined : dueDate ? new Date(dueDate) : null, completed, completedAt: completed ? new Date() : completed === false ? null : undefined } }); activities.push({ tool: "Task updated", detail: updated.title }); return safeJson({ id: updated.id, title: updated.title });
    }}),
    new DynamicStructuredTool({ name: "delete_task", description: "Delete a task only when the user explicitly asks to delete it. Always use list_tasks first when the ID is unknown.", schema: z.object({ id: z.string() }), func: async ({ id }) => {
      const task = await prisma.task.findFirst({ where: { id, userId } }); if (!task) return "Task not found."; await prisma.task.delete({ where: { id } }); activities.push({ tool: "Task deleted", detail: task.title }); return `Deleted ${task.title}.`;
    }}),
    new DynamicStructuredTool({ name: "create_calendar_event", description: "Create a calendar event only when the user explicitly asks. Dates must be complete ISO timestamps.", schema: z.object({ provider: z.enum(["GOOGLE", "OUTLOOK"]), title: z.string().min(1).max(160), start: z.string().datetime(), end: z.string().datetime(), description: z.string().max(4000).optional(), location: z.string().max(300).optional() }), func: async (input) => {
      try { const event = await createCalendarEvent(userId, input as { provider: CalendarProvider; title: string; start: string; end: string; description?: string; location?: string }); activities.push({ tool: "Calendar event created", detail: event.title }); return safeJson(event); } catch (error) { return `Could not create event: ${error instanceof Error ? error.message : "unknown error"}`; }
    }}),
    new DynamicStructuredTool({ name: "start_focus_timer", description: "Start the floating focus timer when the user asks to focus for a number of minutes.", schema: z.object({ minutes: z.number().int().min(1).max(180) }), func: async ({ minutes }) => { timerMinutes = minutes; activities.push({ tool: "Focus timer started", detail: `${minutes} minutes` }); return `Started a ${minutes}-minute focus timer.`; } }),
  ];
  const llm = model();
  if (!llm) return { answer: "Nemo needs an AI provider key before it can think. Add GOOGLE_API_KEY for Google AI Studio or OPENROUTER_API_KEY for OpenRouter, then try again.", activities };
  const messages: BaseMessage[] = [new SystemMessage(`You are Nemo, Athena's concise study agent. Today is ${today()}. Use tools for all user data and actions; never invent tool results. Explain resource answers with document names. For calendar events, require an explicit request and complete date/time details. If key details are missing, ask one focused follow-up. Keep answers under 160 words. Format for scanning: use short paragraphs, Markdown **labels** for metadata, and a proper newline-separated numbered or bulleted list for choices. Never place Markdown list items in the middle of a sentence.`), new HumanMessage(message)];
  const agent = llm.bindTools(tools);
  for (let round = 0; round < 5; round += 1) {
    const reply = await agent.invoke(messages);
    messages.push(reply);
    if (!reply.tool_calls?.length) return { answer: typeof reply.content === "string" ? reply.content : "Done.", activities, timerMinutes };
    for (const call of reply.tool_calls) {
      const tool = tools.find((item) => item.name === call.name);
      const result = tool ? await (tool as unknown as { invoke: (input: unknown) => Promise<unknown> }).invoke(call) : "Unknown tool.";
      messages.push(new ToolMessage({ content: typeof result === "string" ? result : safeJson(result), tool_call_id: call.id! }));
    }
  }
  return { answer: "I completed the available steps. What would you like to do next?", activities, timerMinutes };
}
