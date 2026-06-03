"use client";

import React from "react";
import { NotificationCenter } from "./notification-center";
import { Input } from "@/components/ui/input";
import { Search, CalendarDays } from "lucide-react";
import { useDashboardStore, TimeRange } from "@/stores/dashboard-store";

export function DashboardHeader() {
  const { searchQuery, setSearchQuery, timeRange, setTimeRange } = useDashboardStore();

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-zinc-900/60 w-full relative z-20">
      
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500 pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search quizzes, categories, or active arenas..."
          className="pl-11 bg-zinc-950/40 border-zinc-900 text-white placeholder-zinc-500 focus-visible:ring-purple-500 h-10 rounded-xl"
        />
      </div>

      {/* Right Filters & Alert Center */}
      <div className="flex items-center gap-3 justify-between sm:justify-start">
        
        {/* Time Range Filter Buttons */}
        <div className="bg-zinc-950/40 border border-zinc-900 p-0.5 rounded-xl flex items-center h-10 shadow-inner">
          {(["7D", "30D", "90D"] as TimeRange[]).map((range) => {
            const active = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all duration-300 ${
                  active
                    ? "bg-purple-500/10 text-purple-400 font-extrabold"
                    : "text-zinc-500 hover:text-zinc-300 font-bold"
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>

        {/* Alert Notification center */}
        <NotificationCenter />
      </div>
    </div>
  );
}

export default DashboardHeader;
