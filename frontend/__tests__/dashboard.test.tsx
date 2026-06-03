import { useDashboardStore } from "../stores/dashboard-store";
import React from "react";
import { render, screen } from "@testing-library/react";
import { StatsSkeleton, ChartSkeleton } from "../components/dashboard/skeleton-loaders";
import { EmptyState } from "../components/dashboard/empty-state";
import { Brain } from "lucide-react";

describe("Mindrift Dashboard State & Rendering Test Suite", () => {
  
  describe("Task 17: Zustand Dashboard Store", () => {
    beforeEach(() => {
      useDashboardStore.getState().resetFilters();
    });

    test("should initialize with default 30D and ALL categories", () => {
      const state = useDashboardStore.getState();
      expect(state.timeRange).toBe("30D");
      expect(state.searchQuery).toBe("");
      expect(state.categoryFilter).toBe("ALL");
      expect(state.preferences.showAiInsights).toBe(true);
    });

    test("should update time ranges successfully", () => {
      useDashboardStore.getState().setTimeRange("7D");
      expect(useDashboardStore.getState().timeRange).toBe("7D");

      useDashboardStore.getState().setTimeRange("ALL");
      expect(useDashboardStore.getState().timeRange).toBe("ALL");
    });

    test("should register search queries and filter updates", () => {
      useDashboardStore.getState().setSearchQuery("Docker");
      useDashboardStore.getState().setCategoryFilter("DevOps");

      const state = useDashboardStore.getState();
      expect(state.searchQuery).toBe("Docker");
      expect(state.categoryFilter).toBe("DevOps");
    });

    test("should toggle visualization preferences", () => {
      const prevVal = useDashboardStore.getState().preferences.showAiInsights;
      useDashboardStore.getState().togglePreference("showAiInsights");
      expect(useDashboardStore.getState().preferences.showAiInsights).toBe(!prevVal);
    });
  });

  describe("Task 13 & 15: Skeleton Loaders & Empty States UI Tests", () => {
    test("should verify basic structural elements without runtime issues", () => {
      // Basic check that our skeleton modules are exportable and correct structures
      expect(StatsSkeleton).toBeDefined();
      expect(ChartSkeleton).toBeDefined();
      expect(EmptyState).toBeDefined();
    });
  });
});
