import { editorContentAutosaveSchema } from "./src/modules/invitation/schemas";

const input = {
  invitationId: '30538da2-0b90-4422-8017-1bba18ef7a4b',
  expectedVersion: 45,
  couple: {
    groom: {
      name: 'beni',
      parentNames: ['bapak', 'ibu'],
      photoMediaId: '764797ca-c78a-4f71-9944-06a1f628634a'
    },
    bride: {
      name: 'viya',
      parentNames: ['bapak', 'ibu'],
      photoMediaId: 'a4de6b09-34d1-4105-8658-5e4a9b0d43e9'
    }
  },
  settings: {
    openingText: 'Dalam kasih karunia Tuhan...',
    quoteText: 'Cinta itu sabar...'
  }
};

const result = editorContentAutosaveSchema.safeParse(input);
if (!result.success) {
  console.log(result.error);
} else {
  console.log("Success!");
}
