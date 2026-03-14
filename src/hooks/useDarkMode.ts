"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light" | "system";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): "dark" | "light" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const html = document.documentElement;

  if (resolved === "dark") {
    html.classList.add("dark");
    html.classList.remove("light-theme");
    document.body.classList.remove("light-theme");
  } else {
    html.classList.remove("dark");
    html.classList.add("light-theme");
    document.body.classList.add("light-theme");
  }
}

// Simple external store for theme state
let listeners: Array<() => void> = [];
let currentTheme: Theme = "system";

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "system";
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function setStoreTheme(next: Theme) {
  currentTheme = next;
  localStorage.setItem("theme", next);
  applyTheme(next);
  for (const l of listeners) l();
}

// Initialize from localStorage on first load (client only)
if (typeof window !== "undefined") {
  currentTheme = (localStorage.getItem("theme") as Theme) ?? "system";
}

export function useDarkMode() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const resolved = resolveTheme(theme);

  // Apply theme on mount and listen for system preference changes
  useEffect(() => {
    applyTheme(theme);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (currentTheme === "system") {
        applyTheme("system");
        for (const l of listeners) l();
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setStoreTheme(next);
  }, []);

  const toggle = useCallback(() => {
    const next = resolved === "dark" ? "light" : "dark";
    setStoreTheme(next);
  }, [resolved]);

  return { theme, resolved, setTheme, toggle };
}
