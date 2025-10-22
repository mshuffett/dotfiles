require "nvchad.autocmds"

-- Markdown-specific configuration
vim.api.nvim_create_autocmd("FileType", {
  pattern = "markdown",
  callback = function()
    local bufnr = vim.api.nvim_get_current_buf()

    -- Folding configuration - fold by headers (# ## ### etc)
    vim.opt_local.foldmethod = "expr"
    vim.opt_local.foldexpr = "v:lua.vim.treesitter.foldexpr()"
    vim.opt_local.foldtext = ""  -- Use built-in foldtext
    vim.opt_local.foldenable = true
    vim.opt_local.foldlevel = 99  -- Start with all folds open
    vim.opt_local.foldlevelstart = 99

    -- Markdown-only folding shortcuts
    vim.keymap.set("n", "<leader>za", "za", { buffer = bufnr, desc = "Markdown: toggle fold" })
    vim.keymap.set("n", "<leader>zM", "zM", { buffer = bufnr, desc = "Markdown: close all folds" })
    vim.keymap.set("n", "<leader>zR", "zR", { buffer = bufnr, desc = "Markdown: open all folds" })

    -- Removed auto-open of outline sidebar for markdown at user's request (2025-10-19)
  end,
})
