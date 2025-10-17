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

    -- Auto-open outline sidebar for markdown files
    vim.defer_fn(function()
      -- Only open outline if buffer is still valid and loaded
      if vim.api.nvim_buf_is_valid(bufnr) and vim.api.nvim_buf_is_loaded(bufnr) then
        -- Also check if it's a real file (not a special buffer)
        local bufname = vim.api.nvim_buf_get_name(bufnr)
        if bufname ~= "" and not bufname:match("^%w+://") then
          vim.cmd("Outline")
        end
      end
    end, 150)  -- Small delay to ensure file is loaded
  end,
})
