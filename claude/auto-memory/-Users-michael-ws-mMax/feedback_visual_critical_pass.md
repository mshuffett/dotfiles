---
name: deliberate visual-critical pass after every screenshot
description: After taking a screenshot, run a "what's wrong with this picture?" pass before declaring anything done — don't stop at "did it render?"
type: feedback
originSessionId: 0c00bcf1-3bc5-44fb-be85-7b77526509d3
---
After taking a screenshot to verify a design change, run a deliberate "what's wrong with this picture?" pass *before* declaring the change done.

**Why:** Repeated failure mode — I take a screenshot, see that the change rendered, and call it working. Meanwhile the user immediately spots: an 8 px gap between cube layers, a separate right column that should be integrated into the canvas, a bullet list where an architecture diagram was implied. Each of these is visible in the screenshot. I just don't go looking for them, because by the time the screenshot lands I'm already half-mentally-onto-the-next-step. Pattern-completion bias does the rest — I match the image to my own mental sketch of "what should be there" and miss the diff.

**How to apply:**
1. After every screenshot, before writing any text response or doing any next action, do one explicit pass that is *only* "what looks wrong here?". Hunt actively. Don't ask "does it look right?" — ask "if a designer reviewed this, what would they call out?".
2. Specifically scan for: spacing/alignment glitches, gaps, overlap, contrast problems, text that's too small, things visible that shouldn't be, things missing that should be, layout that's separate when it should be integrated.
3. When the user describes a target ("more like c3.ai", "an architecture diagram"), check whether I've actually delivered that mental image or just something *kind of like it*. "Bullet list with rows of label/value" is not an architecture diagram. "Tower + active pull-out" is not a c3.ai cube unless the gaps and contrast are also right.
4. If I can't honestly find anything wrong, then declare it working. But the default expectation is that *I will find at least one thing* — that's normal in design iteration.
5. This applies equally to: deck slides, standalone HTML, image-gen outputs, design-canvas previews, prototype screenshots.

The user has flagged this pattern explicitly. The deliberate pass takes 10 seconds; the cost of skipping it is the user having to point out things I should have caught.
