const fs = require('fs');
let c = fs.readFileSync('src/app/(dashboard)/dashboard/[id]/edit/page.tsx', 'utf8');

c = c.replace(
  'import { InvitationEditor } from "@/modules/invitation/components/invitation-editor";',
  'import { InvitationEditor } from "@/modules/invitation/components/invitation-editor";\nimport { InvitationSlugEditor } from "@/modules/invitation/components/invitation-slug-editor";'
);

c = c.replace(
  /<InvitationEditor[\s\S]*?\/>/,
  `<div className="space-y-6">
      <InvitationSlugEditor invitationId={editor.invitationId} initialSlug={editor.slug} />
      <InvitationEditor
        initialData={editor}
        saveEditorContent={actionSaveEditorContent}
        saveEditorEvent={actionSaveEditorEvent}
        deleteEditorEvent={actionDeleteEditorEvent}
        reorderEditorEvents={actionReorderEditorEvents}
        issueSensitiveAuth={actionIssueSensitiveAuth}
        updateEditorPrivacy={actionUpdateEditorPrivacy}
      />
    </div>`
);

fs.writeFileSync('src/app/(dashboard)/dashboard/[id]/edit/page.tsx', c);
console.log('Injected slug editor!');
