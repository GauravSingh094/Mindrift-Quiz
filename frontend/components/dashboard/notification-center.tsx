"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Sparkles, Trophy, Settings, ShieldAlert, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationItem {
  id: string;
  type: "competition" | "ai" | "system" | "achievement";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "not_1",
    type: "competition",
    title: "Docker Speed Run starting soon!",
    message: "The competitive arena is filling up. Prepare your containers.",
    time: "5m ago",
    read: false,
  },
  {
    id: "not_2",
    type: "ai",
    title: "New AI Recommendations Generated",
    message: "GC tuning skill gaps detected in your last JVM attempt.",
    time: "2h ago",
    read: false,
  },
  {
    id: "not_3",
    type: "achievement",
    title: "Unlocked 'Polyglot Coder' Badge!",
    message: "Check your badges tab to view your active multipliers.",
    time: "1d ago",
    read: true,
  },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "competition":
        return <Trophy className="h-4 w-4 text-purple-400" />;
      case "ai":
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
      case "achievement":
        return <Check className="h-4 w-4 text-yellow-400" />;
      case "system":
        return <Settings className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900 hover:text-white h-10 w-10 rounded-xl"
          aria-label="Notification Center"
        >
          <Bell className="h-4.5 w-4.5 text-zinc-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-purple-500 text-[9px] font-black text-white flex items-center justify-center border-2 border-black animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 border-zinc-900 bg-zinc-950 shadow-2xl rounded-2xl overflow-hidden" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-900/60 bg-zinc-950/80">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-purple-400" />
            <span>Alert Center</span>
          </h4>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] font-extrabold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-900/60">
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 font-semibold leading-relaxed">
                All caught up. No pending notifications.
              </div>
            ) : (
              notifications.map((not) => (
                <motion.div
                  key={not.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`p-3.5 flex gap-3.5 transition-colors relative hover:bg-zinc-900/25 ${
                    !not.read ? "bg-purple-500/2" : ""
                  }`}
                >
                  <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-xl h-fit">
                    {getIcon(not.type)}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="text-[11px] font-bold text-white tracking-wide">
                        {not.title}
                      </h5>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase whitespace-nowrap">
                        {not.time}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal font-medium">
                      {not.message}
                    </p>
                  </div>

                  {!not.read && (
                    <span className="absolute right-3.5 bottom-3.5 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
