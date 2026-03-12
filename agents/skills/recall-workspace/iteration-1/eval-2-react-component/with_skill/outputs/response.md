Compound component with context is a solid choice — it's the right pattern when you have a parent that owns state and multiple children that need to read/write that state without prop drilling.

Here's the core structure:

```tsx
// 1. Create context with a typed hook
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabsContext must be used within <Tabs>");
  return ctx;
}

// 2. Root component owns the state
function Tabs({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

// 3. Sub-components consume context
function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useTabsContext();
  return (
    <button
      aria-selected={activeTab === id}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== id) return null;
  return <div>{children}</div>;
}

// 4. Attach sub-components as static properties (optional but ergonomic)
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
```

Usage reads cleanly:

```tsx
<Tabs defaultTab="overview">
  <Tabs.Tab id="overview">Overview</Tabs.Tab>
  <Tabs.Tab id="details">Details</Tabs.Tab>
  <Tabs.Panel id="overview">...</Tabs.Panel>
  <Tabs.Panel id="details">...</Tabs.Panel>
</Tabs>
```

**A few tradeoffs to be aware of:**

- The throwing hook (`if (!ctx) throw`) gives a clear error message when the component is used outside the parent — worth keeping.
- Static property attachment (`Tabs.Tab = Tab`) is ergonomic but requires declaring `Tabs` as a `const` (not `function` declaration) if you want TypeScript to infer the statics cleanly, or you cast the type explicitly.
- If you need controlled mode (caller owns the state), add a `value`/`onChange` prop pair and derive whether you're controlled vs uncontrolled, similar to how `<input>` works. Don't try to support both modes with a single `useState` — use a separate `useControlled` hook or a clear conditional.
- Context re-renders all consumers on every state change. If the context value is large or the tree is deep, consider splitting context into a "state" context and a "dispatch" context so read-only consumers don't re-render on unrelated state.

The pattern scales well. Main risk is over-engineering it upfront — start with the simple version and add controlled-mode or context splitting only when you have a concrete need.
