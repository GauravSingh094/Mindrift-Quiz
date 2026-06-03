import { Metadata } from "next";
import React from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { CompetitionsWidget } from "@/components/dashboard/competitions-widget";
import { LeaderboardWidget } from "@/components/dashboard/leaderboard-widget";
import { AiRecommendations } from "@/components/dashboard/ai-recommendations";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AchievementsWidget } from "@/components/dashboard/achievements-widget";
import { DashboardErrorBoundary } from "@/components/dashboard/error-boundary";

export const metadata: Metadata = {
  title: "Dashboard | Mindrift",
  description: "Manage your competitive learning achievements, inspect real-time accuracies, and explore AI recommendations.",
};

export default function DashboardPage() {
  return (
    <div className="container px-4 mx-auto max-w-7xl space-y-7 relative z-10">
      
      {/* 1. Dashboard Sub-Header & Search */}
      <DashboardErrorBoundary>
        <DashboardHeader />
      </DashboardErrorBoundary>

      {/* 2. Welcome Banner */}
      <DashboardErrorBoundary>
        <WelcomeHero streak={5} rank="#12" points={3450} badgesCount={8} />
      </DashboardErrorBoundary>

      {/* 3. Quick Action Cards */}
      <DashboardErrorBoundary>
        <QuickActions />
      </DashboardErrorBoundary>

      {/* 4. Stats Summary Cards Grid */}
      <DashboardErrorBoundary>
        <StatsGrid />
      </DashboardErrorBoundary>

      {/* 5. Performance Trend and Categories Analytics Chart */}
      <DashboardErrorBoundary>
        <AnalyticsSection />
      </DashboardErrorBoundary>

      {/* 6. Deep Features Dynamic Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Side Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Recommendations */}
          <DashboardErrorBoundary>
            <AiRecommendations />
          </DashboardErrorBoundary>

          {/* Multiplayer Competitions Lobbies */}
          <DashboardErrorBoundary>
            <CompetitionsWidget />
          </DashboardErrorBoundary>
        </div>

        {/* Right Side Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Achievements progress & badges */}
          <DashboardErrorBoundary>
            <AchievementsWidget />
          </DashboardErrorBoundary>

          {/* Global Top Performers */}
          <DashboardErrorBoundary>
            <LeaderboardWidget />
          </DashboardErrorBoundary>

          {/* Activity Feed log timeline */}
          <DashboardErrorBoundary>
            <ActivityFeed />
          </DashboardErrorBoundary>
        </div>
      </div>
    </div>
  );
}