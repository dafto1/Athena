const raw = '<｜DSML｜/｜nemo-｜create_｜task｜title:  "Hello 2"｜description:  ""｜priority:  "LOW"｜dueDate:  "2025-10-14T23:59:59.999Z"｜/｜nemo-｜>';

function extractActionAndAnswer(text) {
  let action = null;
  let answer = text;

  // 1. Check for standard <nemo-action> ... </nemo-action>
  const stdMatch = text.match(/<nemo-action>([\s\S]*?)<\/nemo-action>/i);
  if (stdMatch) {
    try {
      action = JSON.parse(stdMatch[1].trim());
      answer = text.replace(/<nemo-action>[\s\S]*?<\/nemo-action>/gi, "").trim();
    } catch {}
  }

  // 2. Check for markdown code fences with json
  if (!action) {
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (jsonMatch) {
      try {
        const candidate = JSON.parse(jsonMatch[1]);
        if (candidate.type) {
          action = candidate;
          answer = text.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, "").trim();
        }
      } catch {}
    }
  }

  // 3. Check for standalone JSON block with "type"
  if (!action) {
    const rawJsonMatch = text.match(/\{[\s\r\n]*"type"\s*:\s*"[^"]+"[\s\S]*?\}/);
    if (rawJsonMatch) {
      try {
        const candidate = JSON.parse(rawJsonMatch[0]);
        if (candidate.type) {
          action = candidate;
          answer = text.replace(rawJsonMatch[0], "").trim();
        }
      } catch {}
    }
  }

  // 4. Check for DSML or pipe-delimited format (<｜DSML｜...｜> or similar)
  if (!action && (text.includes("DSML") || text.includes("｜") || /create_task|start_pomodoro|create_calendar/i.test(text))) {
    const dsmlMatch = text.match(/<[｜|]DSML[｜|][\s\S]*?[｜|]>/i) || text.match(/<[^>]*nemo-[^>]*>/i);
    const targetText = dsmlMatch ? dsmlMatch[0] : text;

    let type = null;
    if (/create_task_calendar/i.test(targetText)) type = "create_task_calendar_event";
    else if (/create_task/i.test(targetText) || (/task/i.test(targetText) && /title/i.test(targetText))) type = "create_task";
    else if (/create_calendar/i.test(targetText) || /calendar_event/i.test(targetText)) type = "create_calendar_event";
    else if (/start_pomodoro|pomodoro/i.test(targetText)) type = "start_pomodoro";
    else if (/record_focus/i.test(targetText)) type = "record_focus_session";

    if (type) {
      const getField = (name) => {
        // match: name: "value" or name="value" or name: value
        const m = targetText.match(new RegExp(name + '\\s*[:=]\\s*"([^"]*)"', 'i')) ||
                  targetText.match(new RegExp(name + '\\s*[:=]\\s*([^｜|\\n,}>]+)', 'i'));
        return m ? m[1].trim().replace(/^["']|["']$/g, "") : undefined;
      };

      if (type === "create_task") {
        const title = getField("title");
        if (title) {
          const desc = getField("description") || null;
          const prioRaw = (getField("priority") || "MEDIUM").toUpperCase();
          const priority = ["LOW", "HIGH"].includes(prioRaw) ? prioRaw : "MEDIUM";
          const dueDate = getField("dueDate") || getField("due") || null;
          action = { type: "create_task", title, description: desc, priority, dueDate };
        }
      } else if (type === "start_pomodoro") {
        const durationMin = parseInt(getField("durationMin") || getField("duration") || "25", 10);
        action = { type: "start_pomodoro", durationMin: isNaN(durationMin) ? 25 : durationMin };
      } else if (type === "record_focus_session") {
        const durationMin = parseInt(getField("durationMin") || "25", 10);
        const startedAt = getField("startedAt") || new Date().toISOString();
        action = { type: "record_focus_session", durationMin, startedAt };
      } else if (type === "create_calendar_event") {
        const title = getField("title");
        const start = getField("start");
        const end = getField("end");
        if (title && start && end) {
          const provider = (getField("provider") || "GOOGLE").toUpperCase() === "OUTLOOK" ? "OUTLOOK" : "GOOGLE";
          action = { type: "create_calendar_event", provider, title, start, end, description: getField("description") || null, location: getField("location") || null };
        }
      }

      if (dsmlMatch) {
        answer = text.replace(dsmlMatch[0], "").trim();
      }
    }
  }

  // Strip any leftover DSML or tag remnants from answer so UI stays completely clean!
  answer = answer
    .replace(/<[｜|][\s\S]*?[｜|]>/g, "")
    .replace(/<nemo-[^>]*>[\s\S]*?<\/nemo-[^>]*>/gi, "")
    .replace(/<nemo-[^>]*>/gi, "")
    .replace(/<\/nemo-[^>]*>/gi, "")
    .replace(/<｜[\s\S]*?｜>/g, "")
    .trim();

  return { action, answer };
}

const result = extractActionAndAnswer(raw);
console.log("RESULT:", JSON.stringify(result, null, 2));
