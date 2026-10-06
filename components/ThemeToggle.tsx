"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_CHANGE_EVENT = "sitescope-theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    document.documentElement.classList.toggle("dark", !isDark);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return <button
    type="button"
    onClick={toggleTheme}
    aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    aria-pressed={isDark}
    title={`Switch to ${isDark ? "light" : "dark"} mode`}
    className="rounded-lg border border-slate-200 p-2 text-slate-700 dark:border-slate-700 dark:text-slate-200"
  >{isDark ? <Sun size={16} /> : <Moon size={16} />}</button>;
}
