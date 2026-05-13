function formatNewspaper(
  paragraphs: string[][],
  aligns: string[],
  width: number,
): string[] {
  const result: string[] = [];
  const border = "*".repeat(width + 2);
  console.log("border.length", border.length);
  result.push(border);

  for (let i = 0; i < paragraphs.length; i++) {
    const words = paragraphs[i]!;
    const align = aligns[i];

    // Word wrap - greedy
    const lines: string[] = [];
    let currentLine: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      const newLength =
        currentLine.length === 0
          ? word.length
          : currentLength + 1 + word.length;
      if (newLength <= width - 2) {
        currentLine.push(word);
        currentLength = newLength;
      } else {
        if (currentLine.length > 0) lines.push(currentLine.join(" "));
        currentLine = [word];
        currentLength = word.length;
      }
    }
    if (currentLine.length > 0) lines.push(currentLine.join(" "));

    // Align and border each line
    for (const line of lines) {
      const padding = width - line.length;
      let formatted: string;

      if (align === "LEFT") {
        formatted = " " + line + " ".repeat(padding - 1);
      } else if (align === "RIGHT") {
        formatted = " ".repeat(padding - 1) + line + " ";
      } else {
        console.log("padding!", padding);
        // CENTER - trailing spaces get the extra space if odd
        const left = Math.floor(padding / 2);

        const right = padding - left;

        console.log("left!", left);
        console.log("right!", right);
        formatted = " ".repeat(left) + line + " ".repeat(right);
      }

      console.log("formatted.length", formatted.length);

      result.push("*" + formatted + "*");
    }
  }

  result.push(border);
  return result;
}

// Example 1: Simple left-aligned paragraph
console.log("=== Example 1: LEFT aligned ===");
console.log(
  formatNewspaper(
    [["Hello", "world", "this", "is", "a", "test"]],
    ["LEFT"],
    40,
  ),
);

// Example 2: Multiple paragraphs with different alignments
console.log("\n=== Example 2: Mixed alignments ===");
console.log(
  formatNewspaper(
    [
      ["Breaking", "News", "Today"],
      [
        "Scientists",
        "discover",
        "new",
        "species",
        "in",
        "the",
        "deep",
        "ocean",
      ],
      ["Read", "more", "inside"],
    ],
    ["CENTER", "LEFT", "RIGHT"],
    30,
  ),
);

// Example 3: Right-aligned single paragraph
console.log("\n=== Example 3: RIGHT aligned ===");
console.log(
  formatNewspaper(
    [["Foster", "families", "make", "a", "difference"]],
    ["RIGHT"],
    25,
  ).join("\n"),
);
