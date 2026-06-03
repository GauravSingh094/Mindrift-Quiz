import { create } from "zustand";

export type TimeRange = "7D" | "30D" | "90D" | "ALL";

interface DashboardPreferences {
  denseLayout: boolean;
  showAiInsights: boolean;
  showActivityFeed: boolean;
}

interface DashboardState {
  timeRange: TimeRange;
  searchQuery: string;
  categoryFilter: string;
  preferences: DashboardPreferences;
  setTimeRange: (timeRange: TimeRange) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  togglePreference: (key: keyof DashboardPreferences) => void;
  resetFilters: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  timeRange: "30D",
  searchQuery: "",
  categoryFilter: "ALL",
  preferences: {
    denseLayout: false,
    showAiInsights: true,
    showActivityFeed: true,
  },
  setTimeRange: (timeRange) => set({ timeRange }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  togglePreference: (key) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: !state.preferences[key],
      },
    })),
  resetFilters: () =>
    set({
      timeRange: "30D",
      searchQuery: "",
      categoryFilter: "ALL",
    }),
}));

export default useDashboardStore;
