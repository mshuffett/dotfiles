return {
  {
    "stevearc/conform.nvim",
    -- event = 'BufWritePre', -- uncomment for format on save
    opts = require "configs.conform",
  },

  -- LSP configuration with auto-install via Mason
  {
    "williamboman/mason.nvim",
    opts = {
      ensure_installed = {
        -- LSP servers
        "lua-language-server",
        "typescript-language-server",
        "html-lsp",
        "css-lsp",
        "json-lsp",
      },
    },
  },

  {
    "williamboman/mason-lspconfig.nvim",
    dependencies = { "williamboman/mason.nvim" },
    config = function()
      require("mason-lspconfig").setup({
        ensure_installed = {
          "lua_ls",
          "ts_ls",
          "html",
          "cssls",
          "jsonls",
          "marksman", -- Markdown LSP
        },
        automatic_installation = true,
        handlers = {
          -- Default handler for all servers
          function(server_name)
            require("lspconfig")[server_name].setup({})
          end,
        },
      })
    end,
  },

  {
    "neovim/nvim-lspconfig",
    dependencies = { "williamboman/mason-lspconfig.nvim" },
    config = function()
      require "configs.lspconfig"
    end,
  },

  -- test new blink
  -- { import = "nvchad.blink.lazyspec" },

  -- {
  -- 	"nvim-treesitter/nvim-treesitter",
  -- 	opts = {
  -- 		ensure_installed = {
  -- 			"vim", "lua", "vimdoc",
  --      "html", "css"
  -- 		},
  -- 	},
  -- },

  -- Tmux integration for seamless navigation
  {
    "christoomey/vim-tmux-navigator",
    lazy = false,  -- Load immediately, don't wait for commands
    keys = {
      { "<C-h>", "<cmd>TmuxNavigateLeft<cr>", desc = "Navigate left (tmux/vim)" },
      { "<C-j>", "<cmd>TmuxNavigateDown<cr>", desc = "Navigate down (tmux/vim)" },
      { "<C-k>", "<cmd>TmuxNavigateUp<cr>", desc = "Navigate up (tmux/vim)" },
      { "<C-l>", "<cmd>TmuxNavigateRight<cr>", desc = "Navigate right (tmux/vim)" },
    },
    init = function()
      -- Disable default mappings so we have full control
      vim.g.tmux_navigator_no_mappings = 1
      -- Don't save on switch (can be slow)
      vim.g.tmux_navigator_save_on_switch = 0
    end,
  },

  -- Configure which-key to show more items before collapsing
  {
    "folke/which-key.nvim",
    opts = {
      plugins = {
        presets = {
          operators = false, -- Don't show operator pending mappings (d, y, c, etc)
          motions = false,   -- Don't show motion mappings (w, b, e, etc)
          text_objects = false, -- Don't show text object mappings (iw, aw, etc)
        },
      },
      win = {
        border = "single",  -- Add border for clarity
        padding = { 1, 2 }, -- More compact padding
      },
      layout = {
        height = { min = 4, max = 25 }, -- Allow taller popup
        width = { min = 20, max = 50 },
        spacing = 3,
      },
      -- Show all items, don't collapse into "+X more"
      expand = 1,  -- 0 = never expand, 1 = always expand
    },
  },

  -- Dressing.nvim - Makes vim.ui.select beautiful with Telescope
  {
    "stevearc/dressing.nvim",
    lazy = false,
    opts = {
      select = {
        backend = { "telescope", "builtin" },  -- Use telescope for all select UIs
        -- Larger command palette with custom dropdown theme
        telescope = require('telescope.themes').get_dropdown({
          layout_config = {
            width = 0.8,      -- 80% of screen width
            height = 0.45,    -- 45% of screen height
          },
        }),
      },
    },
  },

  -- Legendary.nvim - Better command palette (shows commands + keybindings + what they do)
  {
    "mrjones2014/legendary.nvim",
    priority = 10000,
    lazy = false,
    dependencies = {
      "kkharji/sqlite.lua",
      "stevearc/dressing.nvim",  -- Makes legendary use telescope UI
    },
    opts = {
      extensions = {
        lazy_nvim = {},  -- Auto-detect lazy.nvim plugin keymaps
        which_key = {    -- Auto-detect which-key keymaps
          auto_register = true,
        },
      },
      select_prompt = " Command Palette",
      col_separator_char = "│",
    },
  },

  -- Markdown support
  {
    "dkarter/bullets.vim",
    ft = { "markdown", "text" },  -- Only load for markdown files
    config = function()
      vim.g.bullets_enabled_file_types = { "markdown", "text" }
      vim.g.bullets_checkbox_markers = ' x'  -- [ ] and [x]
    end,
  },

  {
    "MeanderingProgrammer/render-markdown.nvim",
    ft = "markdown",
    dependencies = { "nvim-treesitter/nvim-treesitter", "nvim-tree/nvim-web-devicons" },
    opts = {
      -- Render markdown beautifully in the buffer
      heading = {
        enabled = true,
        sign = true,
        icons = { '󰲡 ', '󰲣 ', '󰲥 ', '󰲧 ', '󰲩 ', '󰲫 ' },
      },
      code = {
        enabled = true,
        sign = true,
        style = 'full',
        left_pad = 2,
        right_pad = 2,
      },
      bullet = {
        enabled = true,
        icons = { '●', '○', '◆', '◇' },
      },
    },
  },

  -- Outline sidebar - shows document structure
  {
    "hedyhli/outline.nvim",
    cmd = { "Outline", "OutlineOpen" },
    opts = {
      outline_window = {
        position = 'right',
        width = 30,
      },
      symbols = {
        icons = {
          File = { icon = "󰈔", hl = "Identifier" },
          Module = { icon = "󰆧", hl = "Include" },
          Namespace = { icon = "󰅪", hl = "Include" },
          Package = { icon = "󰏗", hl = "Include" },
          Class = { icon = "𝓒", hl = "Type" },
          Method = { icon = "ƒ", hl = "Function" },
          Property = { icon = "", hl = "Identifier" },
          Field = { icon = "󰆨", hl = "Identifier" },
          Constructor = { icon = "", hl = "Special" },
          Enum = { icon = "ℰ", hl = "Type" },
          Interface = { icon = "󰜰", hl = "Type" },
          Function = { icon = "󰊕", hl = "Function" },
          Variable = { icon = "󰀫", hl = "Constant" },
          Constant = { icon = "󰏿", hl = "Constant" },
          String = { icon = "𝓐", hl = "String" },
          Number = { icon = "#", hl = "Number" },
          Boolean = { icon = "⊨", hl = "Boolean" },
          Array = { icon = "󰅪", hl = "Constant" },
          Object = { icon = "⦿", hl = "Type" },
          Key = { icon = "🔐", hl = "Type" },
          Null = { icon = "NULL", hl = "Type" },
          EnumMember = { icon = "", hl = "Identifier" },
          Struct = { icon = "𝓢", hl = "Structure" },
          Event = { icon = "🗲", hl = "Type" },
          Operator = { icon = "+", hl = "Identifier" },
          TypeParameter = { icon = "𝙏", hl = "Identifier" },
          Component = { icon = "󰅴", hl = "Function" },
          Fragment = { icon = "󰅴", hl = "Constant" },
          TypeAlias = { icon = " ", hl = "Type" },
          Parameter = { icon = " ", hl = "Identifier" },
          StaticMethod = { icon = " ", hl = "Function" },
          Macro = { icon = " ", hl = "Function" },
        },
      },
    },
  },

  -- CodeCompanion.nvim - AI coding assistant with Claude Code support
  {
    "olimorris/codecompanion.nvim",
    lazy = false,  -- Load immediately so keybindings work
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-treesitter/nvim-treesitter",
      "stevearc/dressing.nvim",
    },
    opts = {
      adapters = {
        acp = {
          claude_code = function()
            return require("codecompanion.adapters").extend("claude_code", {
              env = {
                CLAUDE_CODE_OAUTH_TOKEN = vim.fn.getenv("CLAUDE_CODE_OAUTH_TOKEN"),
              },
            })
          end,
        },
      },
      strategies = {
        chat = {
          adapter = "claude_code",  -- Use Claude Code by default
        },
        inline = {
          adapter = "claude_code",
        },
      },
    },
  },

  -- Undo history visualizers
  -- Telescope extension for fuzzy finding through undo history
  {
    "debugloop/telescope-undo.nvim",
    dependencies = {
      "nvim-telescope/telescope.nvim",
      "nvim-lua/plenary.nvim",
    },
    keys = {
      { "<leader>u", "<cmd>Telescope undo<cr>", desc = "Undo History (Telescope)" },
    },
    config = function()
      require("telescope").load_extension("undo")
    end,
  },

  -- Undo tree visualizer - modern Lua version
  {
    "jiaoshijie/undotree",
    dependencies = "nvim-lua/plenary.nvim",
    keys = {
      { "<leader>ut", "<cmd>lua require('undotree').toggle()<cr>", desc = "Undo Tree (sidebar)" },
    },
    opts = {
      float_diff = true,  -- Show diff in floating window
      layout = "left",    -- Tree on left side
      window = {
        winblend = 10,    -- Slight transparency
      },
    },
  },

  -- Avante.nvim - Cursor-like AI coding assistant
  {
    "yetone/avante.nvim",
    event = "VeryLazy",
    lazy = false,
    version = false, -- Use main branch for latest features
    opts = {
      provider = "claude-code",  -- Use Claude Code via ACP
      auto_suggestions_provider = "claude-code",
      -- ACP provider configuration
      acp_providers = {
        ["claude-code"] = {
          command = "npx",
          args = { "@zed-industries/claude-code-acp" },
          env = {
            NODE_NO_WARNINGS = "1",
            CLAUDE_CODE_OAUTH_TOKEN = vim.fn.getenv("CLAUDE_CODE_OAUTH_TOKEN"),
          },
        },
      },
      behaviour = {
        auto_suggestions = false, -- Don't auto-suggest
        auto_set_highlight_group = true,
        auto_set_keymaps = true,
      },
      mappings = {
        diff = {
          ours = "co",
          theirs = "ct",
          all_theirs = "ca",
          both = "cb",
          cursor = "cc",
          next = "]x",
          prev = "[x",
        },
        suggestion = {
          accept = "<M-l>",
          next = "<M-]>",
          prev = "<M-[>",
          dismiss = "<C-]>",
        },
        jump = {
          next = "]]",
          prev = "[[",
        },
      },
      hints = { enabled = true },
      windows = {
        position = "right", -- Sidebar on right
        wrap = true,
        width = 30, -- Percentage
        sidebar_header = {
          align = "center",
          rounded = true,
        },
      },
      highlights = {
        diff = {
          current = "DiffText",
          incoming = "DiffAdd",
        },
      },
    },
    build = "make",
    dependencies = {
      "nvim-treesitter/nvim-treesitter",
      "stevearc/dressing.nvim",
      "nvim-lua/plenary.nvim",
      "MunifTanjim/nui.nvim",
      "nvim-tree/nvim-web-devicons",
      {
        "MeanderingProgrammer/render-markdown.nvim",
        opts = {
          file_types = { "markdown", "Avante" },
        },
        ft = { "markdown", "Avante" },
      },
    },
  },
}
