"use client";

import { useEffect, useRef } from "react";
import { useCompetitionStore } from "../store/competition-store";
import { CompetitionWebSocketService } from "../websocket/competition-websocket";
import { toast } from "sonner";

export function useCompetitionProctoring(enabled: boolean) {
  const addWarning = useCompetitionStore((s) => s.addWarning);
  const socketConnected = useCompetitionStore((s) => s.socketConnected);
  const username = "Arthur Dent"; // fallback or from Clerk user

  useEffect(() => {
    if (!enabled) return;

    // 1. Tab switches (Focus / Blur)
    const handleBlur = () => {
      addWarning("TAB_SWITCH", "System flagged tab switch or app unfocus event.");
      toast.warning("🚨 Proctor Warning: Do not switch tabs during competition!");
      if (socketConnected) {
        CompetitionWebSocketService.broadcastIntegrityWarning(
          "user_demo",
          username,
          "TAB_SWITCH"
        );
      }
    };

    // 2. Clipboard blockers (Copy / Paste)
    const handleClipboard = (e: Event) => {
      e.preventDefault();
      addWarning("COPY_PASTE", "Cut, Copy, and Paste commands are blocked.");
      toast.error("❌ Action Blocked: Cut, Copy, or Paste is disabled in the Arena.");
      if (socketConnected) {
        CompetitionWebSocketService.broadcastIntegrityWarning(
          "user_demo",
          username,
          "COPY_PASTE"
        );
      }
    };

    // 3. Fullscreen checks
    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        addWarning("FULLSCREEN_EXIT", "User exited proctored fullscreen view.");
        toast.error("⚠️ Proctor Warning: Fullscreen mode is required to maintain session!");
        if (socketConnected) {
          CompetitionWebSocketService.broadcastIntegrityWarning(
            "user_demo",
            username,
            "FULLSCREEN_EXIT"
          );
        }
      }
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleClipboard);
    document.addEventListener("cut", handleClipboard);
    document.addEventListener("paste", handleClipboard);
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleClipboard);
      document.removeEventListener("cut", handleClipboard);
      document.removeEventListener("paste", handleClipboard);
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, [enabled, addWarning, socketConnected]);
}

export function useCompetitionTimer() {
  const tickTimer = useCompetitionStore((s) => s.tickTimer);
  const timeRemainingSeconds = useCompetitionStore((s) => s.timeRemainingSeconds);
  const status = useCompetitionStore((s) => s.status);
  const completeAttempt = useCompetitionStore((s) => s.completeAttempt);

  const completeRef = useRef(completeAttempt);
  completeRef.current = completeAttempt;

  useEffect(() => {
    if (status !== "LIVE") return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [status, tickTimer]);

  useEffect(() => {
    if (timeRemainingSeconds === 0 && status === "LIVE") {
      toast.error("⏳ Time is up! Autosubmitting your competition entry.");
      completeRef.current();
    } else if (timeRemainingSeconds === 60 && status === "LIVE") {
      toast.warning("⚠️ 1 minute remaining! Double check your inputs.");
    }
  }, [timeRemainingSeconds, status]);
}
