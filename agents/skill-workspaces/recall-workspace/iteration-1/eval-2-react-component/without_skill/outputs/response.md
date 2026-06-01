The compound component pattern with context is a solid choice when you have a component with multiple related sub-parts that need to share state without prop-drilling. Here's how I'd think about structuring it:

**When it's the right fit:**
- The component has 2+ sub-components that logically belong together (e.g., `<Tabs>`, `<Tab>`, `<TabPanel>`)
- Sub-components need shared state but you don't want to expose it externally
- You want a flexible, composable API for consumers

**Core structure:**

```tsx
// 1. Create the context
interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

// 2. Custom hook for safe context access
function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("useAccordion must be used within <Accordion>");
  return ctx;
}

// 3. Root component owns the state
function Accordion({ children }: { children: React.ReactNode }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div>{children}</div>
    </AccordionContext.Provider>
  );
}

// 4. Sub-components consume context
function AccordionItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { openItems, toggle } = useAccordion();
  const isOpen = openItems.has(id);
  // ...
}

// 5. Attach sub-components to root (optional but common)
Accordion.Item = AccordionItem;
```

**Key tradeoffs to consider:**

- The `throw` in the hook is the right pattern — it gives a clear error at dev time if misused, vs. a confusing runtime failure later.
- Attaching sub-components as properties (`Accordion.Item`) is a style preference; it co-locates the API but can cause issues with tree-shaking in some bundlers. Separate named exports are safer if bundle size matters.
- If the context value object is recreated on every render (common mistake), wrap it in `useMemo` or split state and dispatch into separate contexts.

**Performance note:**

If the component tree under the provider is large and only a subset of children care about certain state, consider splitting the context (e.g., one for state, one for dispatch) or using `useMemo` on the context value to avoid broad re-renders.

What does your specific component do? That would help narrow down whether you need any of the more complex patterns (like `useReducer` instead of `useState`, or multiple contexts).
