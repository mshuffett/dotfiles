-- Neovim Markdown settings: soft word wrap (no mid-character breaks)
-- Managed via ~/.dotfiles (symlinked into ~/.config)

-- Soft word wrap + readable indentation
vim.opt_local.wrap = true
vim.opt_local.linebreak = true
vim.opt_local.breakindent = true
vim.opt_local.breakindentopt = "shift:2,sbr"
vim.opt_local.showbreak = "↪ "

-- Avoid auto hard-wrapping while typing
vim.opt_local.textwidth = 0
vim.opt_local.formatoptions:remove("t")

-- Optional: move by screen (wrapped) lines
vim.keymap.set("n", "j", "gj", { buffer = true, silent = true })
vim.keymap.set("n", "k", "gk", { buffer = true, silent = true })

-- Tab to indent list items (Markdown only)
-- - If cursor is at the start of a bullet like "- ", Tab demotes (indents)
-- - Shift-Tab promotes (outdents)
-- - Otherwise, keep normal cmp/Tab behavior
-- Detect a variety of Markdown list prefixes (unordered, ordered, alpha, roman)
-- and optional checkboxes like "- [ ]" or "1. [x]". Returns true if cursor
-- is within or just after the detected prefix so Tab/S-Tab should indent.
local function at_bullet_edge()
  local col = vim.api.nvim_win_get_cursor(0)[2] -- 0-indexed
  local line = vim.api.nvim_get_current_line()

  local patterns = {
    -- Unordered with checkbox, then without
    "^%s*[%-%+%*]%s+%b[]%s*",
    "^%s*[%-%+%*]%s+",
    -- Numeric ordered with optional checkbox
    "^%s*%d+[%.)]%s+%b[]%s*",
    "^%s*%d+[%.)]%s+",
    -- Roman numerals with optional checkbox
    "^%s*[ivxlcdmIVXLCDM]+[%.)]%s+%b[]%s*",
    "^%s*[ivxlcdmIVXLCDM]+[%.)]%s+",
    -- Alphabetic (1-3 letters) with optional checkbox
    "^%s*%a%a?%a?[%.)]%s+%b[]%s*",
    "^%s*%a%a?%a?[%.)]%s+",
  }

  local bullet_end = nil
  for _, pat in ipairs(patterns) do
    local _, e = string.find(line, pat)
    if e then bullet_end = e; break end
  end

  if not bullet_end then return false end
  -- Treat cursor as within bullet prefix or immediately after it
  return (col + 1) <= (bullet_end + 1)
end

local function feed(keys)
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes(keys, true, true, true), "i", true)
end

-- If nvim-cmp is available, override its Tab mapping just for markdown
local ok_cmp, cmp = pcall(require, "cmp")
if ok_cmp and cmp then
  cmp.setup.filetype("markdown", {
    -- Autocomplete ON, but no raw buffer words
    sources = cmp.config.sources({
      { name = "nvim_lsp" },
      { name = "luasnip" },
      { name = "render-markdown" },
    }, {
      { name = "path" },
    }),

    mapping = {
      ["<Tab>"] = cmp.mapping(function(fallback)
        if at_bullet_edge() then
          feed("<Plug>(bullets-demote)")
        elseif cmp.visible() then
          cmp.select_next_item()
        else
          fallback()
        end
      end, { "i", "s" }),

      ["<S-Tab>"] = cmp.mapping(function(fallback)
        if at_bullet_edge() then
          feed("<Plug>(bullets-promote)")
        elseif cmp.visible() then
          cmp.select_prev_item()
        else
          fallback()
      end
    end, { "i", "s" }),
    },
  })
else
  -- Fallback: buffer-local mappings without cmp
  vim.keymap.set("i", "<Tab>", function()
    if at_bullet_edge() then
      feed("<Plug>(bullets-demote)")
    else
      return "\t"
    end
  end, { buffer = true, expr = true, silent = true })

  vim.keymap.set("i", "<S-Tab>", function()
    if at_bullet_edge() then
      feed("<Plug>(bullets-promote)")
      return ""
    else
      return "\t"
    end
  end, { buffer = true, expr = true, silent = true })
end
