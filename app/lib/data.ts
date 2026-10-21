export type Hand = "R" | "L";
export interface Note { h: Hand; g: number } // g = notas de ornamento (flam/drag) antes da nota

// [nome, categoria, sticking] — minúscula = ornamento
export const RUDIMENTS: [string, string, string][] = [
  ["Single Stroke Roll","Rolls","R L R L R L R L"],["Single Stroke Four","Rolls","R L R L L R L R"],["Single Stroke Seven","Rolls","R L R L R L R"],
  ["Multiple Bounce Roll","Rolls","R R L L"],["Triple Stroke Roll","Rolls","R R R L L L"],["Double Stroke Open Roll","Rolls","R R L L"],
  ["Five Stroke Roll","Rolls","R R L L R"],["Six Stroke Roll","Rolls","R L L R R L"],["Seven Stroke Roll","Rolls","R R L L R R L"],
  ["Nine Stroke Roll","Rolls","R R L L R R L L R"],["Ten Stroke Roll","Rolls","R R L L R R L L R L"],["Eleven Stroke Roll","Rolls","R R L L R R L L R R L"],
  ["Thirteen Stroke Roll","Rolls","R R L L R R L L R R L L R"],["Fifteen Stroke Roll","Rolls","R R L L R R L L R R L L R R L"],["Seventeen Stroke Roll","Rolls","R R L L R R L L R R L L R R L L R"],
  ["Single Paradiddle","Paradiddles","R L R R L R L L"],["Double Paradiddle","Paradiddles","R L R L R R L R L R L L"],["Triple Paradiddle","Paradiddles","R L R L R L R R L R L R L R L L"],
  ["Single Paradiddle-diddle","Paradiddles","R L R R L L"],
  ["Flam","Flams","lR rL"],["Flam Accent","Flams","lR L R rL R L"],["Flam Tap","Flams","lR R rL L"],["Flamacue","Flams","lR L R L"],
  ["Flam Paradiddle","Flams","lR L R R rL R L L"],["Single Flammed Mill","Flams","lR R L R rL L R L"],["Flam Paradiddle-diddle","Flams","lR L R R L L"],
  ["Pataflafla","Flams","lR L R rL R L"],["Swiss Army Triplet","Flams","lR R L rL L R"],["Inverted Flam Tap","Flams","lR L rL R"],["Flam Drag","Flams","lR llL"],
  ["Drag (Ruff)","Drags","llR rrL"],["Single Drag Tap","Drags","llR L rrL R"],["Double Drag Tap","Drags","llR llR L rrL rrL R"],
  ["Lesson 25","Drags","llR L R rrL R L"],["Single Dragadiddle","Drags","llR L R R rrL R L L"],["Drag Paradiddle #1","Drags","R llL R R L R L L"],
  ["Drag Paradiddle #2","Drags","R llL R llL R R L R L L"],["Single Ratamacue","Drags","llL R L R"],["Double Ratamacue","Drags","llL llR L R"],["Triple Ratamacue","Drags","llL llR llL R L R"],
];
export const CATEGORIES = ["Todos", ...Array.from(new Set(RUDIMENTS.map((r) => r[1])))];

export const PIECES = ["CR", "HH", "T10", "T12", "S14", "CX", "K"];
export const PIECE_COLORS = ["#f59f00", "#c9a227", "#2fb344", "#15aabf", "#e03131", "#868e96", "#f06595"];
export const KICK = 6;

export function parseSticking(s: string): Note[] {
  const out: Note[] = [];
  let g = 0;
  for (const tok of s.split(" "))
    for (const c of tok) {
      if (c === c.toLowerCase()) g++;
      else { out.push({ h: c as Hand, g }); g = 0; }
    }
  return out;
}
export const label = (h: string) => (h.toUpperCase() === "R" ? "D" : "E");
