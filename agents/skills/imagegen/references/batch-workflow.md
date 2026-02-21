# Batch Image Generation Workflow

When generating multiple related images (slides, assets, variations):

## Before Starting

1. **Establish design system first** - don't generate ad-hoc
2. **Create reference images** - generate 3-5 test images to validate aesthetic
3. **Document the design language** - colors (hex), typography, layout rules
4. **Note what works/doesn't** - update prompts based on results

## During Generation

- **Generate variations in parallel** - use multiple bash calls simultaneously
- **Be explicit about negatives** - "no gradients, no glows, no logos"
- **Use specific hex colors** - not "dark gray" but "#0a0a0a"
- **Avoid brand names** - describe style instead ("minimal dark aesthetic" not "Apple style")

## After Each Batch

- **Review and note patterns** - what prompt language worked?
- **Update skill/memory** - document successful prompts
- **Iterate on failures** - refine prompts, don't just regenerate

## Common Pitfalls

- Starting generation without design system = inconsistent results
- Vague color descriptions = wrong palette
- Mentioning brands = unwanted logos/elements
- Not specifying negatives = decorative clutter

## Detailed Prompt Example

```text
"A vintage boxing poster style illustration. Bold distressed typography at top: 'ACCOUNTABILITY CLUB' in chunky serif font, cream color. Center: two silhouetted figures at laptops facing each other. Background: deep navy blue with halftone texture. Accent: bright orange. Worn paper texture, torn edges. Style: screenprint aesthetic."
```
