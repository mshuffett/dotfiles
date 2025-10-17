require "nvchad.mappings"

-- add yours here

local map = vim.keymap.set

map("n", ";", ":", { desc = "CMD enter command mode" })
map("i", "jk", "<ESC>")

-- Better keybinding discovery
map("n", "<leader>fk", "<cmd>Telescope keymaps<cr>", { desc = "Find keymaps" })
map("n", "<leader>fc", "<cmd>Telescope commands<cr>", { desc = "Find commands" })

-- Ctrl-P for legendary command palette (shows commands + keybindings + what they do)
-- Uses Telescope UI automatically via legendary's telescope extension
map("n", "<C-p>", "<cmd>Legendary<cr>", { desc = "Command palette (Legendary)" })

-- Alternative: Space + Space for quick legendary access
map("n", "<leader><leader>", "<cmd>Legendary<cr>", { desc = "Command palette" })

-- Override NvChad's C-hjkl mappings to use vim-tmux-navigator for seamless tmux integration
-- This allows unified navigation between vim splits and tmux panes
map("n", "<C-h>", "<cmd>TmuxNavigateLeft<cr>", { desc = "TmuxNavigate left" })
map("n", "<C-j>", "<cmd>TmuxNavigateDown<cr>", { desc = "TmuxNavigate down" })
map("n", "<C-k>", "<cmd>TmuxNavigateUp<cr>", { desc = "TmuxNavigate up" })
map("n", "<C-l>", "<cmd>TmuxNavigateRight<cr>", { desc = "TmuxNavigate right" })

-- Markdown preview - toggle between rendered and raw view
map("n", "<leader>mp", "<cmd>RenderMarkdown toggle<cr>", { desc = "Markdown: toggle preview" })

-- Open markdown file in split with rendered view
map("n", "<leader>ms", function()
  vim.cmd("vsplit")
  vim.cmd("RenderMarkdown enable")
end, { desc = "Markdown: split with preview" })

-- Markdown checkbox toggle - multiple options for convenience
map("n", "<leader>mt", "<cmd>ToggleCheckbox<cr>", { desc = "Markdown: toggle checkbox" })
map("n", "<C-t>", "<cmd>ToggleCheckbox<cr>", { desc = "Markdown: toggle checkbox" })
map("i", "<C-t>", "<cmd>ToggleCheckbox<cr>", { desc = "Markdown: toggle checkbox" })
map("v", "<leader>mt", "<cmd>ToggleCheckbox<cr>", { desc = "Markdown: toggle checkbox" })
map("v", "<C-t>", "<cmd>ToggleCheckbox<cr>", { desc = "Markdown: toggle checkbox" })

-- Outline sidebar - shows document structure (headings for markdown)
map("n", "<leader>o", "<cmd>Outline<cr>", { desc = "Toggle outline sidebar" })

-- CodeCompanion AI assistant
map("n", "<leader>a", "<cmd>CodeCompanionActions<cr>", { desc = "AI: actions menu" })
map("n", "<leader>ac", "<cmd>CodeCompanionChat<cr>", { desc = "AI: open chat" })
map("n", "<leader>at", "<cmd>CodeCompanionToggle<cr>", { desc = "AI: toggle chat" })
map("v", "<leader>a", "<cmd>CodeCompanionActions<cr>", { desc = "AI: actions on selection" })
map("v", "<leader>ac", "<cmd>CodeCompanionChat<cr>", { desc = "AI: chat with selection" })

-- map({ "n", "i", "v" }, "<C-s>", "<cmd> w <cr>")
