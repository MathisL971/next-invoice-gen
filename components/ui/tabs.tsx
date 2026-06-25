"use client";

import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Navigation par onglets"
      className={`flex w-full gap-1 rounded-xl border border-teal-900/8 bg-white/60 p-1 dark:border-teal-500/15 dark:bg-stone-900/60 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-teal-800 text-white shadow-sm shadow-teal-900/15 dark:bg-teal-700"
                : "text-stone-600 hover:bg-teal-50/80 hover:text-teal-900 dark:text-stone-400 dark:hover:bg-stone-800/80 dark:hover:text-teal-100"
            }`}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({
  id,
  activeTab,
  children,
  className = "",
}: TabPanelProps) {
  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={`space-y-6 ${className}`}
    >
      {children}
    </div>
  );
}
