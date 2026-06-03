"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Trophy, Star, Sparkles, Activity, Clock } from "lucide-react";
import { EmptyState } from "./empty-state";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityItem {
  id: string;
  type: "quiz" | "competition" | "badge" | "ai";
  title: string;
  description: string;
  timestamp: string;
  points?: number;
}

const mockActivities: ActivityItem[] = [
  {
    id: "act_1",
    type: "quiz",
    title: "Completed Next.js Advanced Architecture Quiz",
    description: "Scored 92% (Easy diff). Locked in +250 XP.",
    timestamp: "2 hours ago",
    points: 250,
  },
  {
    id: "act_2",
    type: "competition",
    title: "Joined SRE Live Performance Arena",
    description: "Ranked #4 among 45 participants. Fast speed runs.",
    timestamp: "5 hours ago",
    points: 400,
  },
  {
    id: "act_3",
    type: "badge",
    title: "Unlocked 'Polyglot Coder' Badge",
    description: "Unlocked after completing quizzes in 4 separate languages.",
    timestamp: "1 day ago",
  },
  {
    id: "act_4",
    type: "ai",
    title: "Generated AI System Design Quiz",
    description: "Created customized recommendations targeting load balancer gaps.",
    timestamp: "2 days ago",
  },
];

const mockMoreActivities: ActivityItem[] = [
  {
    id: "act_5",
    type: "quiz",
    title: "Completed Spring Security JWT Validation",
    description: "Scored 100% (Medium diff). Perfect attempt.",
    timestamp: "3 days ago",
    points: 350,
  },
  {
    id: "act_6",
    type: "ai",
    title: "Completed interview preparation Suggestion",
    description: "Validated skill sets in Python algorithms.",
    timestamp: "4 days ago",
  },
];

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "quiz":
        return <Brain className="h-4.5 w-4.5 text-blue-400" />;
      case "competition":
        return <Trophy className="h-4.5 w-4.5 text-purple-400" />;
      case "badge":
        return <Star className="h-4.5 w-4.5 text-yellow-400 animate-pulse" />;
      case "ai":
        return <Sparkles className="h-4.5 w-4.5 text-cyan-400" />;
    }
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setActivities((prev) => [...prev, ...mockMoreActivities]);
      setHasMore(false);
      setIsLoading(false);
    }, 800);
  };

  if (activities.length === 0) {
    return (
      <EmptyState
        title="No Activity Record"
        description="Completed quiz scores and competitive participation milestones appear here."
        icon={Activity}
      />
    );
  }

  return (
    <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="pb-4 border-b border-zinc-900/50">
        <CardTitle className="text-base font-black tracking-tight text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-400" />
          <span>Recent Activity Feed</span>
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500 font-semibold mt-0.5">
          Real-time logs of your learning strides.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        <div className="relative border-l border-zinc-900/80 ml-3.5 pl-5.5 space-y-5">
          <AnimatePresence initial={false}>
            {activities.map((act) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative"
              >
                {/* Timeline Dot Icon */}
                <div className="absolute -left-[35px] top-0.5 p-1.5 bg-zinc-950 border border-zinc-900 rounded-full shadow-md z-10">
                  {getActivityIcon(act.type)}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-1">
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide hover:text-purple-400 transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium leading-normal mt-0.5 max-w-[280px]">
                      {act.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-bold uppercase tracking-wider mt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{act.timestamp}</span>
                  </div>
                </div>

                {act.points && (
                  <div className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-400 mt-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    +{act.points} XP
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {hasMore && (
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant="ghost"
            className="w-full text-zinc-400 hover:text-white border border-zinc-900 hover:bg-zinc-900 h-9 text-xs font-bold rounded-xl mt-4"
          >
            {isLoading ? "Fetching Activities..." : "Load Older Activities"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
