-- neorg-zoom.lua
-- Workflowy-style zoom for neorg files
-- <leader>zz to zoom into heading, <leader>zo to zoom out

local M = {}

-- Store zoom stack (for nested zooming)
M.zoom_stack = {}

-- Get the heading at cursor and all its children using line-based detection
local function get_heading_range()
  local bufnr = vim.api.nvim_get_current_buf()
  local cursor = vim.api.nvim_win_get_cursor(0)
  local cursor_row = cursor[1] -- 1-indexed

  local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)

  -- Find the heading at or before cursor
  local heading_row = nil
  local heading_level = nil
  local heading_title = nil

  for i = cursor_row, 1, -1 do
    local line = lines[i]
    local stars = line:match("^(%*+)%s")
    if stars then
      heading_row = i
      heading_level = #stars
      heading_title = line:match("^%*+%s+(.+)") or "Untitled"
      break
    end
  end

  if not heading_row then
    vim.notify("No heading found at or before cursor", vim.log.levels.WARN)
    return nil
  end

  -- Find the end of this heading's content (until next heading of same or higher level)
  local content_end = #lines

  for i = heading_row + 1, #lines do
    local line = lines[i]
    local stars = line:match("^(%*+)%s")
    if stars and #stars <= heading_level then
      content_end = i - 1
      break
    end
  end

  return {
    start_line = heading_row - 1,  -- convert to 0-indexed
    end_line = content_end - 1,    -- convert to 0-indexed
    title = heading_title,
    level = heading_level,
  }
end

-- Zoom into the heading at cursor
function M.zoom_in()
  local range = get_heading_range()
  if not range then return end

  local bufnr = vim.api.nvim_get_current_buf()
  local filename = vim.api.nvim_buf_get_name(bufnr)
  local lines = vim.api.nvim_buf_get_lines(bufnr, range.start_line, range.end_line + 1, false)

  -- Check if we're in a zoom buffer - if so, save it first
  local current_state = M.zoom_stack[#M.zoom_stack]
  if current_state and vim.api.nvim_buf_get_option(bufnr, "modified") then
    M.save_zoom()
  end

  -- Push state onto stack for zooming out
  local state = {
    original_buf = bufnr,
    original_file = filename,
    start_line = range.start_line,
    end_line = range.end_line,
    title = range.title,
    is_zoom_buf = current_state ~= nil, -- track if source was already a zoom buffer
  }
  table.insert(M.zoom_stack, state)

  -- Create new buffer
  local zoom_buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_lines(zoom_buf, 0, -1, false, lines)

  -- Set buffer options
  vim.api.nvim_buf_set_option(zoom_buf, "filetype", "norg")
  vim.api.nvim_buf_set_option(zoom_buf, "buftype", "acwrite")
  vim.api.nvim_buf_set_name(zoom_buf, "[Zoom] " .. range.title)

  -- Open in current window
  vim.api.nvim_set_current_buf(zoom_buf)

  -- Set up autocmd for saving
  vim.api.nvim_create_autocmd("BufWriteCmd", {
    buffer = zoom_buf,
    callback = function()
      M.save_zoom()
    end,
  })

  -- Set modified to false initially
  vim.api.nvim_buf_set_option(zoom_buf, "modified", false)

  -- Update statusline
  M.update_statusline()

  vim.notify("Zoomed into: " .. range.title, vim.log.levels.INFO)
end

-- Save zoomed content back to original file
function M.save_zoom()
  local state = M.zoom_stack[#M.zoom_stack]
  if not state then
    vim.notify("Not in zoom mode", vim.log.levels.ERROR)
    return
  end

  local zoom_buf = vim.api.nvim_get_current_buf()
  local new_lines = vim.api.nvim_buf_get_lines(zoom_buf, 0, -1, false)

  -- Read original file
  local original_lines = {}
  local file = io.open(state.original_file, "r")
  if file then
    for line in file:lines() do
      table.insert(original_lines, line)
    end
    file:close()
  end

  -- Replace the zoomed section
  local result = {}

  -- Add lines before zoom section
  for i = 1, state.start_line do
    table.insert(result, original_lines[i])
  end

  -- Add new zoomed content
  for _, line in ipairs(new_lines) do
    table.insert(result, line)
  end

  -- Add lines after zoom section
  for i = state.end_line + 2, #original_lines do
    table.insert(result, original_lines[i])
  end

  -- Write back to file
  file = io.open(state.original_file, "w")
  if file then
    file:write(table.concat(result, "\n"))
    file:close()
  end

  -- Update the end_line in case content length changed
  local line_diff = #new_lines - (state.end_line - state.start_line + 1)
  state.end_line = state.end_line + line_diff

  -- Mark buffer as not modified
  vim.api.nvim_buf_set_option(zoom_buf, "modified", false)

  -- Reload original buffer if it's open and not a zoom buffer
  if not state.is_zoom_buf and vim.api.nvim_buf_is_valid(state.original_buf) then
    vim.api.nvim_buf_call(state.original_buf, function()
      vim.cmd("edit!")
    end)
  end

  vim.notify("Saved to " .. vim.fn.fnamemodify(state.original_file, ":t"), vim.log.levels.INFO)
end

-- Zoom out (return to original)
function M.zoom_out()
  local state = M.zoom_stack[#M.zoom_stack]
  if not state then
    vim.notify("Not in zoom mode", vim.log.levels.WARN)
    return
  end

  local zoom_buf = vim.api.nvim_get_current_buf()

  -- Check for unsaved changes
  if vim.api.nvim_buf_get_option(zoom_buf, "modified") then
    local choice = vim.fn.confirm("Save changes before zooming out?", "&Yes\n&No\n&Cancel", 1)
    if choice == 1 then
      M.save_zoom()
    elseif choice == 3 then
      return
    end
  end

  -- Pop from stack
  table.remove(M.zoom_stack)

  -- Return to original buffer
  local orig_buf = state.original_buf
  if vim.api.nvim_buf_is_valid(orig_buf) then
    vim.api.nvim_set_current_buf(orig_buf)
    -- Jump to the heading we were zoomed into
    vim.api.nvim_win_set_cursor(0, { state.start_line + 1, 0 })
  else
    -- Original buffer closed, open the file
    vim.cmd("edit " .. state.original_file)
    vim.api.nvim_win_set_cursor(0, { state.start_line + 1, 0 })
  end

  -- Delete zoom buffer
  vim.api.nvim_buf_delete(zoom_buf, { force = true })

  -- Update statusline
  M.update_statusline()

  vim.notify("Zoomed out from: " .. state.title, vim.log.levels.INFO)
end

-- Get zoom info for statusline
function M.get_statusline()
  if #M.zoom_stack > 0 then
    -- Build breadcrumb path from stack
    local titles = {}
    for _, state in ipairs(M.zoom_stack) do
      table.insert(titles, state.title)
    end
    return " [ZOOM: " .. table.concat(titles, " > ") .. "]"
  end
  return ""
end

-- Update statusline (for NvChad)
function M.update_statusline()
  -- This will be picked up by statusline if configured
  vim.g.neorg_zoom_status = M.get_statusline()
end

-- Setup keymaps
function M.setup()
  vim.api.nvim_create_autocmd("FileType", {
    pattern = "norg",
    callback = function()
      local opts = { buffer = true, silent = true }
      vim.keymap.set("n", "<leader>zz", M.zoom_in, vim.tbl_extend("force", opts, { desc = "Zoom into heading" }))
      vim.keymap.set("n", "<leader>zo", M.zoom_out, vim.tbl_extend("force", opts, { desc = "Zoom out" }))
    end,
  })

  -- Also set keymaps for zoom buffers (for nested zooming)
  vim.api.nvim_create_autocmd("BufEnter", {
    pattern = "\\[Zoom\\]*",
    callback = function()
      local opts = { buffer = true, silent = true }
      vim.keymap.set("n", "<leader>zz", M.zoom_in, vim.tbl_extend("force", opts, { desc = "Zoom into heading" }))
      vim.keymap.set("n", "<leader>zo", M.zoom_out, vim.tbl_extend("force", opts, { desc = "Zoom out" }))
    end,
  })
end

return M
