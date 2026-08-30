
import fs from "fs";
let content = fs.readFileSync("src/modules/invitation/components/editor/steps/event-step.tsx", "utf-8");

content = content.replace(
  "buildIsoString(formatForInput(event.startsAt), newTz)",
  "buildIsoString(formatForInput(event.startsAt, event.timezone || \"Asia/Jakarta\"), newTz)"
);

content = content.replace(
  "buildIsoString(formatForInput(event.endsAt), newTz)",
  "buildIsoString(formatForInput(event.endsAt, event.timezone || \"Asia/Jakarta\"), newTz)"
);

content = content.replace(
  "value={formatForInput(event.startsAt)}",
  "value={formatForInput(event.startsAt, event.timezone || \"Asia/Jakarta\")}"
);

content = content.replace(
  "value={formatForInput(event.endsAt)}",
  "value={formatForInput(event.endsAt, event.timezone || \"Asia/Jakarta\")}"
);

fs.writeFileSync("src/modules/invitation/components/editor/steps/event-step.tsx", content);

