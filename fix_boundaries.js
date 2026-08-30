
import fs from "fs";
let checkout = fs.readFileSync("src/app/(dashboard)/dashboard/[id]/checkout-button.tsx", "utf-8");
checkout = checkout.replace("from \"@/modules/invitation/server/actions\"", "from \"@/modules/invitation/client-actions\"");
fs.writeFileSync("src/app/(dashboard)/dashboard/[id]/checkout-button.tsx", checkout);

let editorReadiness = fs.readFileSync("src/modules/invitation/components/editor/editor-publish-readiness.tsx", "utf-8");
editorReadiness = editorReadiness.replace("from \"../../server/actions\"", "from \"../../client-actions\"");
fs.writeFileSync("src/modules/invitation/components/editor/editor-publish-readiness.tsx", editorReadiness);

