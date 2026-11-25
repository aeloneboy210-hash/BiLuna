# Step 7: the doctor's review note

Goal: the doctor writes a short note back on a summary a patient shared, and the patient sees it in their chat.

## What people see

- **Doctor** (open a shared summary): a "Your note for the patient" box beside the summary, with "Send note".
  After sending, the note shows with "✅ Sent to the patient · time" and an "Edit note" button.
  The list of shared summaries marks each one the doctor has answered with "✅ Note sent".
- **Patient** (Health chat): the "Prepare for my doctor" button gets a "🩺 Doctor replied" badge. Opening it
  shows the note at the top: "Note from Dr. Karim (demo doctor)", the text, the time, and
  "Written by the doctor, not by BiLuna."
- All new text exists in English and Bangla.

## Rules (enforced by the database, table `summary_reviews`, migration 0011)

- A doctor can write one note per summary, and only while the patient shares it with them. They can edit it
  while shared. After the patient stops sharing, the doctor can neither see nor change the note.
- Which patient a note belongs to is taken from the summary itself (a trigger), never from the doctor.
- The patient reads every note on their own summaries and keeps them after stopping the share; they cannot
  write or change a doctor's note. Other patients and the hospital admin see nothing.
- Notes are 1-1000 characters, never blank.

## Tests

- `supabase/tests/0011_review_notes.sql`: every rule above, run on the live database in a rolled-back
  transaction.
- `tests/lib/consult/review.test.ts`: note cleaning (trim, blank refused, too long refused not cut).

## Not in this step

- The access history (step 8) will list notes along with shares, views and stops.
