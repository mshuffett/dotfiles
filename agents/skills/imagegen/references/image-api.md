# Image API quick reference

## Endpoints
- Generate: `POST /v1/images/generations` (`client.images.generate(...)`)
- Edit: `POST /v1/images/edits` (`client.images.edit(...)`)

## Models
- Default: `gpt-image-2`
- Alternatives: `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`

## Core parameters (generate + edit)
- `prompt`: text prompt
- `model`: image model
- `n`: number of images (1-10)
- `size`: `auto` or a model-supported `WIDTHxHEIGHT` value
- `quality`: `low`, `medium`, `high`, or `auto`
- `background`: `transparent`, `opaque`, or `auto`
- `output_format`: `png` (default), `jpeg`, `webp`
- `output_compression`: 0-100 (jpeg/webp only)
- `moderation`: `auto` (default) or `low`

## Edit-specific parameters
- `image`: one or more input images (first image is primary)
- `mask`: optional mask image (same size, alpha channel required)
- `input_fidelity`: `low` or `high` for models prior to `gpt-image-2`; omit it for `gpt-image-2`, which always uses high-fidelity image inputs.

## Model-specific size notes
- `gpt-image-2` accepts flexible sizes when all of these constraints are met:
- Maximum edge length `<= 3840px`
- Both edges multiples of `16px`
- Long-edge to short-edge ratio `<= 3:1`
- Total pixels between `655,360` and `8,294,400`
- Popular `gpt-image-2` sizes include `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `2048x1152`, `3840x2160`, `2160x3840`, and `auto`
- Models prior to `gpt-image-2` use the legacy size set: `1024x1024`, `1536x1024`, `1024x1536`, or `auto`

## Output
- `data[]` list with `b64_json` per image

## Limits & notes
- Input images and masks must be under 50MB.
- Use edits endpoint when the user requests changes to an existing image.
- Masking is prompt-guided; exact shapes are not guaranteed.
- Large sizes and high quality increase latency and cost.
- For fast iteration or latency-sensitive runs, start with `quality=low`; raise to `high` for text-heavy or detail-critical outputs.
- `gpt-image-2` does not currently support transparent backgrounds.
- Use `input_fidelity=high` for strict edits only on models prior to `gpt-image-2`.
