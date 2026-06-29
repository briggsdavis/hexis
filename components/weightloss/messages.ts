/**
 * Short, transient encouragement shown after logging a day. The whole tone is
 * deliberately calm: progress comes from showing up consistently, not from any
 * single heroic or punishing day.
 */

// Shown after a deficit day. Theme: steady, patient, compounding effort.
export const DEFICIT_MESSAGES = [
  "Another brick laid. Walls go up slowly.",
  "Small deficit, real progress. Keep it gentle.",
  "Consistency just beat intensity again.",
  "Quietly forward. That's the whole game.",
  "One steady day stacked on the last.",
  "Slow is smooth, and smooth is lasting.",
  "You showed up. That's what moves the needle.",
  "Tiny wins compound. This was one of them.",
  "Nice and sustainable — exactly the pace.",
  "Progress you can actually keep. Well done.",
  "The vial inched up. So did you.",
  "Patience in motion. Keep trusting it.",
  "No rush. You're trending the right way.",
  "A calm deficit beats a frantic one.",
  "Drop by drop, the vial fills.",
  "Steady hands, steady gains.",
  "That's a deposit in the long game.",
  "Gentle and repeatable — that's how it sticks.",
  "Forward is forward, however small.",
  "You kept the streak of showing up alive.",
];

// Shown after a surplus day. Theme: one off day is fine; progress remains and
// tomorrow is open. Never shaming, never alarmist.
export const SURPLUS_MESSAGES = [
  "One surplus day doesn't undo your progress.",
  "It's okay. The trend is bigger than today.",
  "A wobble, not a setback. Back at it tomorrow.",
  "You're still ahead of where you started.",
  "Rough day logged honestly — that's strength too.",
  "Tomorrow's a clean slate. You've got it.",
  "Progress isn't a straight line. This is normal.",
  "One day up doesn't erase the days down.",
  "Be kind to yourself. Then begin again.",
  "The vial held its ground. Keep going.",
  "Honesty today, deficit tomorrow. Onward.",
  "Everyone has these. Consistency still wins.",
  "No guilt needed — just your next good day.",
  "You're allowed to be human. Reset tomorrow.",
  "The long game forgives a single day.",
  "Still standing, still in this. Tomorrow's yours.",
  "A pause, not a stop. Pick it back up.",
  "Logged it, owned it, moving on. Nice.",
  "One day won't define the month.",
  "Breathe. Your progress is still right there.",
];

// Shown for an exact net-zero day (neither deficit nor surplus).
export const NEUTRAL_MESSAGES = [
  "Held steady. Tomorrow you can tip it forward.",
  "Even ground today. Still in the game.",
  "A flat day, honestly logged. That counts.",
];

export function pickMessage(net: number): string {
  const bank =
    net > 0 ? DEFICIT_MESSAGES : net < 0 ? SURPLUS_MESSAGES : NEUTRAL_MESSAGES;
  // No Math.random restriction here (client-side); vary by time.
  return bank[Math.floor(Math.random() * bank.length)];
}
