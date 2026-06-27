---
name: FluidOrb Skia shader fix
description: FluidOrb rendered black because it used RuntimeShader (image filter) instead of Shader (pixel generator) — fixed by swapping to Shader component
type: project
---

The `FluidOrb` component (`apps/mobile/components/ramble-next/FluidOrb.tsx`) rendered solid black because it used the wrong Skia component.

**Root cause:** `<RuntimeShader>` is an **image filter** (processes existing pixels). `<Shader>` **generates pixels**. Since `Fill` has no existing pixels to filter, `RuntimeShader` produced all black. The fix was simply swapping `RuntimeShader` → `Shader` in the import and JSX.

**How to apply:** When using custom GLSL shaders with `Skia.RuntimeEffect.Make()` inside a `<Fill>`, always use `<Shader source={...} uniforms={...} />`, NOT `<RuntimeShader>`. RuntimeShader is only for image filter use cases (e.g., post-processing a Group's rendered output).

This was NOT a simulator Metal limitation — Skia works fine in the iOS simulator.
