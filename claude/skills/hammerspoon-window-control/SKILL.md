---
description: Use when controlling macOS windows via Hammerspoon, creating custom window layouts, or integrating with hhtwm tiling manager.
---

# Hammerspoon Window Control with hhtwm

## Philosophy: Hybrid Approach

**Best Practice**: Use hhtwm's cache for context/state, then direct Hammerspoon commands for precise control.

**Why?**
- Query hhtwm's state (tracked windows, floating status, layouts)
- Make surgical changes without triggering full retile
- Avoid disrupting other windows on screen
- Keep hhtwm aware of changes for future operations

## Core Patterns

### 1. Query hhtwm State

```lua
-- Get windows tracked in current space
local spaceId = 3  -- Current space ID
local spaceWindows = hhtwm.cache.spaces[spaceId]

-- Check if window is floating
local win = hs.window.frontmostWindow()
local isFloating = hhtwm.isFloating(win)

-- Get current layout
local currentLayout = hhtwm.getLayout(spaceId)

-- Get all available layouts
local layouts = hhtwm.getLayouts()
```

### 2. Direct Window Manipulation (No Retiling)

```lua
-- Set exact position and size
local win = hs.window.find("Chrome")
win:setFrame({x=0, y=0, w=1920, h=1080})

-- Or use screen-relative positioning
local screen = hs.screen.mainScreen()
local screenFrame = screen:frame()
win:setFrame({
  x = screenFrame.x,
  y = screenFrame.y,
  w = screenFrame.w / 2,  -- Half screen width
  h = screenFrame.h
})
```

### 3. Update hhtwm Cache (Optional)

```lua
-- Add window to hhtwm tracking (if needed)
table.insert(hhtwm.cache.spaces[spaceId], newWindow)

-- Mark window as floating
table.insert(hhtwm.cache.floating, win)

-- DON'T call hhtwm.tile() unless you want everything rearranged
```

## Common Use Cases

### Creating Custom Layouts

```lua
-- Example: Coding layout (editor left, terminal bottom-right, browser top-right)
local screen = hs.screen.mainScreen():frame()

-- Editor on left (50% width)
hs.window.find("Zed"):setFrame({
  x = screen.x,
  y = screen.y,
  w = screen.w / 2,
  h = screen.h
})

-- Browser top-right (50% width, 50% height)
hs.window.find("Chrome"):setFrame({
  x = screen.x + screen.w / 2,
  y = screen.y,
  w = screen.w / 2,
  h = screen.h / 2
})

-- Terminal bottom-right (50% width, 50% height)
hs.window.find("iTerm"):setFrame({
  x = screen.x + screen.w / 2,
  y = screen.y + screen.h / 2,
  w = screen.w / 2,
  h = screen.h / 2
})
```

### Smart Window Finding

```lua
-- Find by application name
local win = hs.window.find("Chrome")

-- Find by title pattern
local win = hs.window.find(".*Obsidian.*")

-- Get all windows
local allWindows = hs.window.allWindows()

-- Filter windows
local chromeWindows = hs.fnutils.filter(allWindows, function(w)
  return w:application():name() == "Google Chrome"
end)
```

### Working with hhtwm Layouts

```lua
-- Switch layout AND tile (affects all windows)
hhtwm.setLayout("main-left")
hhtwm.tile()

-- Just query layout without changing
local currentLayout = hhtwm.getLayout()
if currentLayout == "monocle" then
  -- Do something specific for monocle mode
end
```

## When to Use Each Approach

### Use Direct Hammerspoon When:
- Creating specific window arrangements ("coding layout")
- Moving individual windows precisely
- Implementing custom layouts not in hhtwm
- You don't want to disturb other windows
- Claude Code integration for custom layouts

### Use hhtwm API When:
- Switching between predefined tiling layouts
- Want automatic window arrangement
- Need to work with hhtwm's layout system
- Managing floating windows within tiling context

### Use Hybrid Approach When:
- Need context from hhtwm (what's tracked, what's floating)
- Want precise control without full retile
- Building on top of hhtwm's tracking system
- Implementing smart window management with Claude

## hhtwm API Reference

### Core Functions

```lua
-- Layout management
hhtwm.setLayout(layoutName)      -- Set layout for current space
hhtwm.getLayout([spaceId])        -- Get current layout
hhtwm.getLayouts()                -- Get all available layouts
hhtwm.tile()                      -- Retile all windows (triggers full rearrangement)
hhtwm.reset()                     -- Reset layout
hhtwm.equalizeLayout()            -- Equalize window sizes

-- Window management
hhtwm.swapInDirection(win, dir)   -- dir: 'north', 'south', 'east', 'west'
hhtwm.toggleFloat(win)            -- Toggle floating mode
hhtwm.isFloating(win)             -- Check if window is floating

-- Cache access
hhtwm.cache.spaces[spaceId]       -- Windows tracked in space
hhtwm.cache.floating              -- Array of floating windows
hhtwm.cache.filter                -- Window filter object
```

### Available Layouts

| Layout | Description |
|--------|-------------|
| `main-left` | Main window on left, others stacked right |
| `main-right` | Main window on right, others stacked left |
| `main-center` | Main window in center |
| `monocle` | Each window fullscreen (causes "maximizing" issue) |
| `tabbed-left` | Tabbed layout on left |
| `tabbed-right` | Tabbed layout on right |
| `floating` | All windows float |

## Direct Hammerspoon API Reference

### Window Functions

```lua
-- Finding windows
hs.window.find(hint)              -- Find by app name or title
hs.window.allWindows()            -- Get all windows
hs.window.frontmostWindow()       -- Get focused window
hs.window.focusedWindow()         -- Alias for frontmost

-- Window manipulation
win:setFrame(rect)                -- {x, y, w, h}
win:frame()                       -- Get current frame
win:move(rect)                    -- Move to rect
win:moveToScreen(screen)          -- Move to different screen
win:application()                 -- Get parent application
win:title()                       -- Get window title

-- Window state
win:isFullScreen()
win:isMinimized()
win:isVisible()
```

### Screen Functions

```lua
hs.screen.mainScreen()            -- Get primary screen
hs.screen.allScreens()            -- Get all screens
screen:frame()                    -- Get screen dimensions
screen:id()                       -- Get screen ID
```

## Claude Code Integration Pattern

When Claude Code needs to arrange windows:

```lua
-- 1. Query current state
local spaceId = 3  -- or get dynamically
local trackedWindows = hhtwm.cache.spaces[spaceId] or {}

-- 2. Find target windows
local editor = hs.window.find("Zed")
local terminal = hs.window.find("iTerm")
local browser = hs.window.find("Chrome")

-- 3. Set precise positions (no tile() call)
local screen = hs.screen.mainScreen():frame()
editor:setFrame({x=screen.x, y=screen.y, w=screen.w/2, h=screen.h})
terminal:setFrame({x=screen.x+screen.w/2, y=screen.y+screen.h/2, w=screen.w/2, h=screen.h/2})
browser:setFrame({x=screen.x+screen.w/2, y=screen.y, w=screen.w/2, h=screen.h/2})

-- 4. Optionally update hhtwm cache if tracking needed
-- (Usually not necessary for one-off layouts)
```

## Running Commands via Claude Code

Execute these patterns using the `hs` command:

```bash
# Set a specific layout
hs -c 'hhtwm.setLayout("main-left"); hhtwm.tile()'

# Move window without tiling
hs -c 'local win = hs.window.find("Chrome"); win:setFrame({x=0, y=0, w=960, h=1080})'

# Check current layout
hs -c 'print("Current layout:", hhtwm.getLayout())'

# Create custom arrangement
hs -c '
local screen = hs.screen.mainScreen():frame()
hs.window.find("Zed"):setFrame({x=screen.x, y=screen.y, w=screen.w/2, h=screen.h})
hs.window.find("iTerm"):setFrame({x=screen.x+screen.w/2, y=screen.y, w=screen.w/2, h=screen.h})
'
```

## Key Principles

1. **Query before acting** - Use hhtwm cache to understand current state
2. **Precise control** - Use direct Hammerspoon for surgical changes
3. **Avoid retiling** - Don't call `hhtwm.tile()` unless you want everything rearranged
4. **Update cache selectively** - Only if you need hhtwm to track changes
5. **Test incrementally** - Verify each window move before chaining commands

## Troubleshooting

### Windows Not Moving
- Check if window exists: `hs.window.find("AppName")`
- Verify app name: `win:application():name()`
- Check if fullscreen: `win:isFullScreen()` (hhtwm ignores fullscreen windows)

### hhtwm Interfering
- Disable auto-tiling on launch (already done in current config)
- Use floating windows: `hhtwm.toggleFloat(win)` before moving
- Work outside hhtwm entirely with direct Hammerspoon only

### Finding Windows
- Use partial title match: `hs.window.find(".*partial.*")`
- List all windows: `hs.fnutils.each(hs.window.allWindows(), function(w) print(w:title()) end)`
- Filter by app: See "Smart Window Finding" section above

## Acceptance Checks

- [ ] Can query hhtwm layout state without side effects
- [ ] Direct window positioning works without triggering retile
- [ ] `hs -c` commands execute successfully from shell
- [ ] Custom layouts position windows as expected

## See Also

- hhtwm source: `~/.hammerspoon/hhtwm/init.lua`
- Hammerspoon docs: https://www.hammerspoon.org/docs/
