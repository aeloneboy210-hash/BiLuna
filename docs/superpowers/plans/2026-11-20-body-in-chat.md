# Phase 1c: the 3D body inside the BiLuna chat

Goal: the patient can point at where it hurts on the 3D body, and BiLuna's answer can show the part that
"may be involved" lit up in 3D, without leaving the chat.

## What the patient sees

1. **Body button** (left of the message box). Opens the 3D body above the box: "Tap where it hurts".
   Tapping a bone or organ shows a chip: "📍 Left leg · Tibia (left)" with a ✕ to clear it.
2. **Sending** adds the chip as the first line of the message: `📍 Where it hurts: Left leg · Tibia (left)`
   (Bangla: `📍 কোথায় সমস্যা: বাম পা · Tibia (বাম)`). The message can be just the point, or point + words.
   In the patient's bubble that line shows as a chip.
3. **3D card in replies.** When BiLuna's answer is about an organ, the reply ends with a card:
   "May be involved: Lungs. This is not the cause; a doctor must check." and a "Show in 3D" button.
   The newest card opens by itself with the organ glowing. Only one 3D view is open at a time
   (phones allow few 3D views; older cards show the button instead).

## How it works

- The model may add one tag on its own line: `[[body:lungs]]`, from the 12 organ names in `regions.ts`.
  `extractBodyTag` removes every tag and keeps the first valid organ; unknown names are dropped.
- `askBiLuna` takes the tag off before the safety filter (so the confidence line check is unchanged),
  and puts it back at the end only for real answers (not greetings or follow-up questions).
- The saved reply keeps the tag, so old chats show their cards after a reload. The screen never shows the tag.
- No database change. The body code (three.js) loads only when a 3D view opens, so the chat stays light.

## Safety

- The card always says "may be involved" and "not the cause".
- The tag cannot carry anything but one of 12 fixed organ names.

## Tests (written first)

- `tests/lib/body/chat-body.test.ts`: tag extraction, invalid tags, several tags, pointed line in both languages, parsing the pointed line back.
- `tests/lib/health/model.test.ts`: tag kept on answers, dropped on follow-up questions, confidence line still added.
- instructions mention the tag and the organ list.
