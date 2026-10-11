// What real people said after trying Bond Secure, shown on the landing page.
// ONLY real quotes, word for word, from people who said yes to being quoted. No names
// unless they asked for theirs. The landing page hides this section while the list is empty.

export interface Voice {
  quote: string;
  who: string; // e.g. "International student, Surry Hills"
}

// From the tester feedback form, 10–11 Oct 2026. All 4 testers (international students) agreed
// to be quoted without their name. Quoted exactly as written.
export const VOICES: Voice[] = [
  {
    quote:
      "I was having trouble with getting my bond back, after sending the document, he understands to take me seriously. I would definitely recommend this to anyone who has had problems with their money!",
    who: "International student who tested Bond Secure",
  },
  {
    quote: "company was registered in a different name so was hard to find who to complain to",
    who: "International student who tested Bond Secure",
  },
];
