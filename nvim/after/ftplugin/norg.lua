-- Auto-complete: snippets only | <C-Space>: everything including words
local ok, cmp = pcall(require, "cmp")
if ok then
  cmp.setup.buffer({
    sources = {
      { name = "luasnip" },
      { name = "neorg" },  -- Links, references, etc.
    },
    mapping = {
      ["<C-Space>"] = cmp.mapping(function()
        cmp.complete({
          config = {
            sources = {
              { name = "luasnip" },
              { name = "neorg" },
              { name = "buffer" },
            },
          },
        })
      end, { "i" }),
    },
  })
end
