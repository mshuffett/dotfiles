import { useState, useEffect, useCallback } from "react";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Session, InboxItem, ProcessedItem } from "../types";

const CACHE_DIR = join(homedir(), ".cache", "gtd-inbox");
const SESSION_FILE = join(CACHE_DIR, "session.json");
const CONTEXTS_FILE = join(CACHE_DIR, "contexts.json");

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function loadSession(): Session | null {
  try {
    if (existsSync(SESSION_FILE)) {
      const data = readFileSync(SESSION_FILE, "utf-8");
      return JSON.parse(data) as Session;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function saveSession(session: Session) {
  ensureCacheDir();
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

export function clearSession() {
  try {
    if (existsSync(SESSION_FILE)) {
      writeFileSync(SESSION_FILE, "");
    }
  } catch {
    // Ignore errors
  }
}

export function loadContexts(): string[] {
  try {
    if (existsSync(CONTEXTS_FILE)) {
      const data = readFileSync(CONTEXTS_FILE, "utf-8");
      return JSON.parse(data) as string[];
    }
  } catch {
    // Ignore errors
  }
  return [];
}

export function saveContext(context: string) {
  ensureCacheDir();
  const contexts = loadContexts();
  if (!contexts.includes(context)) {
    contexts.push(context);
    writeFileSync(CONTEXTS_FILE, JSON.stringify(contexts, null, 2));
  }
}

interface UseSessionOptions {
  inputFile: string;
  items: InboxItem[];
  resume?: boolean;
  fresh?: boolean;
}

export function useSession({ inputFile, items, resume, fresh }: UseSessionOptions) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processed, setProcessed] = useState<ProcessedItem[]>([]);
  const [sessionItems, setSessionItems] = useState<InboxItem[]>(items);

  useEffect(() => {
    if (fresh) {
      // Start fresh, ignore saved session
      setSessionItems(items);
      setCurrentIndex(0);
      setProcessed([]);
      return;
    }

    const saved = loadSession();
    if (saved && (resume || saved.input_file === inputFile)) {
      // Resume previous session
      setSessionItems(saved.items);
      setCurrentIndex(saved.current_index);
      setProcessed(saved.processed);
      setSession(saved);
    } else {
      // Start new session
      setSessionItems(items);
      setCurrentIndex(0);
      setProcessed([]);
    }
  }, [inputFile, items, resume, fresh]);

  const persistSession = useCallback(
    (newIndex: number, newProcessed: ProcessedItem[], newItems?: InboxItem[]) => {
      const sessionData: Session = {
        input_file: inputFile,
        items: newItems || sessionItems,
        processed: newProcessed,
        current_index: newIndex,
        started_at: session?.started_at || new Date().toISOString(),
      };
      saveSession(sessionData);
      setSession(sessionData);
    },
    [inputFile, sessionItems, session]
  );

  const addProcessed = useCallback(
    (item: ProcessedItem) => {
      const newProcessed = [...processed, item];
      const newIndex = currentIndex + 1;
      setProcessed(newProcessed);
      setCurrentIndex(newIndex);

      // Save context for autocomplete
      if (item.context) {
        saveContext(item.context);
      }

      persistSession(newIndex, newProcessed);
    },
    [processed, currentIndex, persistSession]
  );

  const updateCurrentItem = useCallback(
    (newText: string) => {
      const newItems = [...sessionItems];
      newItems[currentIndex] = { ...newItems[currentIndex], text: newText };
      setSessionItems(newItems);
      persistSession(currentIndex, processed, newItems);
    },
    [sessionItems, currentIndex, processed, persistSession]
  );

  const updateCurrentNotes = useCallback(
    (notes: string) => {
      const newItems = [...sessionItems];
      newItems[currentIndex] = { ...newItems[currentIndex], notes };
      setSessionItems(newItems);
      persistSession(currentIndex, processed, newItems);
    },
    [sessionItems, currentIndex, processed, persistSession]
  );

  // Go back to previous item to fix mistakes
  const goBackToPrevious = useCallback(() => {
    if (currentIndex === 0) return false;

    // Remove the last processed item and go back
    const newProcessed = processed.slice(0, -1);
    const newIndex = currentIndex - 1;

    setProcessed(newProcessed);
    setCurrentIndex(newIndex);
    persistSession(newIndex, newProcessed);

    return true;
  }, [currentIndex, processed, persistSession]);

  // Update a previously processed item (when revisiting)
  const updateProcessedItem = useCallback(
    (item: ProcessedItem) => {
      // Find and replace the item in processed array
      const existingIndex = processed.findIndex((p) => p.id === item.id);
      if (existingIndex >= 0) {
        const newProcessed = [...processed];
        newProcessed[existingIndex] = item;
        setProcessed(newProcessed);
        persistSession(currentIndex, newProcessed);
      } else {
        // Item wasn't processed yet, add it normally
        addProcessed(item);
      }
    },
    [processed, currentIndex, persistSession, addProcessed]
  );

  return {
    items: sessionItems,
    currentIndex,
    processed,
    currentItem: sessionItems[currentIndex] || null,
    isComplete: currentIndex >= sessionItems.length,
    canGoBack: currentIndex > 0,
    addProcessed,
    updateCurrentItem,
    updateCurrentNotes,
    goBackToPrevious,
    updateProcessedItem,
    contexts: loadContexts(),
  };
}
