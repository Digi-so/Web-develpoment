/* global console */
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. Search notes
function searchNotes(word) {
  return notes.filter((note) =>
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}

// Test searchNotes
console.log(searchNotes("day")); // Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }]
console.log(searchNotes("javascript")); // Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]
console.log(searchNotes("pizza")); // Expected: []


// 2. Find the longest note
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (const currentNote of notes.slice(1)) {
    if (currentNote.text.length > longest.text.length) {
      longest = currentNote;
    }
  }

  return longest;
}

// Test longestNote
console.log(longestNote()); // Expected: { id: 3, text: "Email the project report to Grace", category: "work" }
console.log(longestNote() === null); // Expected: false


// 3. Count notes by category
function countByCategory() {
  const counts = {};

  for (const note of notes) {
    if (counts[note.category] === undefined) {
      counts[note.category] = 0;
    }

    counts[note.category]++;
  }

  return counts;
}

// Test countByCategory
console.log(countByCategory()); // Expected: { personal: 2, study: 2, work: 1 }
console.log(countByCategory().personal); // Expected: 2


// 4. Get notes summary
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// Show the starter notes and summary on the page.
function renderNotes() {
  const summaryElement = document.querySelector("#summary");
  const notesElement = document.querySelector("#notes");

  summaryElement.textContent = getSummary();
  notesElement.replaceChildren(
    ...notes.map((note) => {
      const item = document.createElement("li");
      item.append(document.createTextNode(note.text));

      const category = document.createElement("span");
      category.className = "category";
      category.textContent = note.category;
      item.append(category);

      return item;
    })
  );
}

renderNotes();

// Test getSummary
console.log(getSummary()); // Expected: "5 notes: 2 personal, 1 work, 2 study."
console.log(getSummary().includes("5 notes")); // Expected: true


// 5. Check for duplicate notes
function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase();

  return notes.some(
    (note) => note.text.trim().toLowerCase() === normalizedText
  );
}

// Test isDuplicate
console.log(isDuplicate("Call mum")); // Expected: true
console.log(isDuplicate("  CALL MUM  ")); // Expected: true
console.log(isDuplicate("Go shopping")); // Expected: false


// 6. Add a note
function addNote(text, category) {
  const trimmedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Note must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(trimmedText)) {
    console.log("Note is a duplicate.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Invalid category. Use personal, work, or study.");
    return false;
  }

  const newId =
    notes.length > 0
      ? Math.max(...notes.map((note) => note.id)) + 1
      : 1;

  notes.push({
    id: newId,
    text: trimmedText,
    category: category,
  });

  return true;
}

// Test addNote - normal case
console.log(addNote("Walk the dog", "personal")); // Expected: true

// Test addNote - duplicate
console.log(addNote("  CALL MUM  ", "personal")); // Expected: false

// Test addNote - invalid category
console.log(addNote("Finish homework", "school")); // Expected: false

// Test addNote - empty text
console.log(addNote("   ", "personal")); // Expected: false

// Test addNote - text longer than 200 characters
console.log(addNote("a".repeat(201), "study")); // Expected: false

// Show final notes
console.log(notes); // Expected: original 5 notes plus "Walk the dog"
