"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile, getUserPreferences, updateNotificationPreferences, updatePrivacyPreferences, updateAIPreferences, getUserSessions, revokeUserSession, revokeAllUserSessions, triggerDataExportArchive, deleteUserAccountPermanently } from "@/features/settings/api";
import { UserProfile, UserPreferences, NotificationSettings, UserSession, PrivacySettings, ConnectedAccount, AIPerferences } from "@/features/settings/types";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Lock,
  Bell,
  Shield,
  Clock,
  Eye,
  Link as LinkIcon,
  Bot,
  Download,
  AlertTriangle,
  Loader2,
  CheckCircle,
  HelpCircle,
  Github,
  Globe,
  Settings,
  Share2,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsHubPage() {
  const router = useRouter();

  const store = useSettingsStore();

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Profile forms state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [skillsStr, setSkillsStr] = useState("");

  // AI Forms
  const [aiGoals, setAiGoals] = useState("");

  // Danger zone validation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load settings bundle
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const prof = await getUserProfile();
        store.setProfile(prof);
        setFullName(prof.name);
        setBio(prof.bio);
        setSkillsStr(prof.skills.join(", "));

        const prefBundle = await getUserPreferences();
        store.setPreferences(prefBundle.preferences);
        store.setNotifications(prefBundle.notifications);
        store.setPrivacy(prefBundle.privacy);
        store.setConnections(prefBundle.connections);
        store.setAIPreferences(prefBundle.aiPreferences);
        setAiGoals(prefBundle.aiPreferences.learningGoals);

        const sess = await getUserSessions();
        store.setSessions(sess);
      } catch (err) {
        toast.error("Failed to sync settings registries.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const skills = skillsStr.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await updateUserProfile({ name: fullName, bio, skills });
      if (res.success) {
        store.updateProfile({ name: fullName, bio, skills });
        toast.success("Profile credentials updated successfully!");
      }
    } catch (_) {
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleNotification = async (key: keyof NotificationSettings) => {
    if (!store.notifications) return;
    const nextVal = !store.notifications[key];
    store.updateNotifications({ [key]: nextVal });
    try {
      await updateNotificationPreferences({ [key]: nextVal });
      toast.success("Notification preferences updated.");
    } catch (_) {
      toast.error("Failed to sync preferences.");
    }
  };

  const handleTogglePrivacy = async (key: keyof PrivacySettings) => {
    if (!store.privacy) return;
    const nextVal = key === "profileVisibility" 
      ? (store.privacy.profileVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC")
      : !store.privacy[key];
    store.updatePrivacy({ [key]: nextVal });
    try {
      await updatePrivacyPreferences({ [key]: nextVal });
      toast.success("Privacy configurations synchronized.");
    } catch (_) {
      toast.error("Failed to sync privacy configurations.");
    }
  };

  const handleUpdateAIPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store.aiPreferences) return;
    setIsUpdating(true);
    try {
      await updateAIPreferences({ learningGoals: aiGoals });
      store.updateAIPreferences({ learningGoals: aiGoals });
      toast.success("AI learning preferences locked in!");
    } catch (_) {
      toast.error("Failed to update AI configurations.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      const res = await revokeUserSession(id);
      if (res.success) {
        store.revokeSession(id);
        toast.success("Active session successfully revoked.");
      }
    } catch (_) {
      toast.error("Failed to revoke session.");
    }
  };

  const handleRevokeAll = async () => {
    try {
      const res = await revokeAllUserSessions();
      if (res.success) {
        store.revokeAllSessions();
        toast.success("All other active device sessions revoked.");
      }
    } catch (_) {
      toast.error("Failed to complete action.");
    }
  };

  const handleDataExport = async () => {
    toast.info("Assembling and encrypting data archive zip...");
    try {
      const res = await triggerDataExportArchive(["profile", "quizzes", "competitions"]);
      if (res.success) {
        toast.success("Secure data archive compiled successfully!");
        window.open(res.downloadUrl, "_blank");
      }
    } catch (_) {
      toast.error("Failed to trigger data export.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.warning("Please type 'DELETE' to confirm deletion verification.");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteUserAccountPermanently();
      if (res.success) {
        toast.success("Account permanently deleted. Safely logging out.");
        store.clearStore();
        router.push("/");
      }
    } catch (_) {
      toast.error("An error occurred during deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  const menuItems = [
    { id: "profile", label: "Profile Info", icon: <User className="h-4 w-4" /> },
    { id: "account", label: "Account Desk", icon: <Settings className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "security", label: "Security Center", icon: <Shield className="h-4 w-4" /> },
    { id: "sessions", label: "Active Sessions", icon: <Clock className="h-4 w-4" /> },
    { id: "privacy", label: "Privacy Rules", icon: <Eye className="h-4 w-4" /> },
    { id: "connections", label: "Connections", icon: <LinkIcon className="h-4 w-4" /> },
    { id: "ai", label: "AI Mentor", icon: <Bot className="h-4 w-4" /> },
    { id: "export", label: "Data Export", icon: <Download className="h-4 w-4" /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle className="h-4 w-4 text-purple-400" /> }
  ];

  if (isLoading || !store.profile || !store.preferences || !store.notifications || !store.privacy || !store.aiPreferences) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-500 font-semibold tracking-wide animate-pulse">
          Opening settings registries...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-5xl space-y-8 relative z-10">
      
      {/* Page Header */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent font-mono">
          System Settings
        </h1>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          Configure profile details, manage active SSO connected sessions, adjust proctoring preferences, and verify danger zones.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 items-stretch">
        
        {/* Left Column Sidebar tabs (1/4 width) */}
        <div className="flex flex-col gap-1.5 justify-start md:col-span-1">
          {menuItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 text-xs font-bold p-3.5 rounded-xl transition-all border uppercase tracking-wider text-left ${
                  active
                    ? "bg-purple-500/10 border-purple-500 text-purple-400"
                    : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-850 hover:text-zinc-300"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Columns tab contents workspace (3/4 width) */}
        <Card className="md:col-span-3 border-zinc-900 bg-zinc-950/40 backdrop-blur-xl relative overflow-hidden p-6 md:p-8 min-h-[480px]">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/1 via-transparent to-transparent pointer-events-none" />
          
          <AnimatePresence mode="wait">
            
            {/* 1. PROFILE INFO */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Profile Information</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Customize your public presence card</span>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-bold text-zinc-400">
                  <div className="flex items-center gap-4 border-b border-zinc-900/30 pb-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white uppercase border-2 border-background shadow-[0_0_15px_rgba(168,85,247,0.15)] shrink-0">
                      {store.profile.name.slice(0, 2)}
                    </div>
                    <div className="space-y-1">
                      <Button
                        type="button"
                        onClick={() => toast.success("Emulating Supabase Storage avatar upload...")}
                        className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-extrabold h-9 text-[9px] rounded-lg gap-1 uppercase"
                      >
                        Upload Avatar
                      </Button>
                      <span className="text-[8px] text-zinc-500 font-semibold block">JPEG, PNG max 2MB.</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Full Name</span>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-700 rounded-xl text-xs h-10 pl-3"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Bio</span>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 text-white placeholder-zinc-700 rounded-xl text-xs min-h-[80px] max-h-none resize-none pl-3 pt-2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Skills (separated by commas)</span>
                    <Input
                      type="text"
                      value={skillsStr}
                      onChange={(e) => setSkillsStr(e.target.value)}
                      className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-700 rounded-xl text-xs h-10 pl-3"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-10 px-6 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 2. ACCOUNT SETTINGS */}
            {activeTab === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Account Desk</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Manage email configurations and check join milestones</span>
                </div>

                <div className="space-y-4 text-xs font-bold text-zinc-400">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Registered Email</span>
                    <div className="flex gap-3">
                      <Input
                        type="email"
                        value={store.preferences.email}
                        disabled
                        className="bg-zinc-950 border-zinc-900 text-zinc-500 rounded-xl text-xs h-10 pl-3"
                      />
                      <Button
                        type="button"
                        onClick={() => toast.success("Verification link sent to email!")}
                        className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-extrabold h-10 text-[9px] rounded-lg gap-1 uppercase"
                      >
                        Verify Email
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-900/30 pt-4 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Account Status</span>
                      <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[8px] font-bold uppercase rounded-full">
                        {store.preferences.accountStatus}
                      </Badge>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5 block">Join Date</span>
                      <p className="text-sm font-black font-mono text-white mt-1">
                        {new Date(store.preferences.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. NOTIFICATION PREFERENCES */}
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Notification Preferences</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Configure alerting channels for competitions and recommendations</span>
                </div>

                <div className="space-y-4 text-xs font-bold text-zinc-350">
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-xs leading-none">Competition Alerts</p>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-1">Recieve real-time lobby updates for registered match arenas</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={store.notifications.competitions}
                      onChange={() => handleToggleNotification("competitions")}
                      className="h-4.5 w-4.5 rounded border-zinc-850 text-purple-500 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-xs leading-none">Quiz Practice Alerts</p>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-1">Recieve alerts for daily master quiz targets completions</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={store.notifications.quizzes}
                      onChange={() => handleToggleNotification("quizzes")}
                      className="h-4.5 w-4.5 rounded border-zinc-850 text-purple-500 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-xs leading-none">AI Insight Recommendations</p>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-1">Get custom compiled study roadmap resources notifications</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={store.notifications.aiRecommendations}
                      onChange={() => handleToggleNotification("aiRecommendations")}
                      className="h-4.5 w-4.5 rounded border-zinc-850 text-purple-500 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. SECURITY CENTER */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Security Center</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Update credentials and inspect security log arrays</span>
                </div>

                <div className="space-y-5 text-xs font-bold text-zinc-400">
                  <div className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-xs">Clerk Managed Password</p>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-1">Account credentials are managed securely via Clerk SSO</span>
                    </div>
                    <Button
                      onClick={() => toast.success("Reset password ticket dispatched to your email!")}
                      className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-extrabold h-9 text-[9px] rounded-lg gap-1 uppercase"
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. ACTIVE SESSIONS */}
            {activeTab === "sessions" && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-xs font-black text-white uppercase tracking-wider">Active Device Sessions</h2>
                    <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Verify and revoke authenticated SSO tokens</span>
                  </div>
                  <Button
                    onClick={handleRevokeAll}
                    variant="ghost"
                    className="border border-zinc-900 hover:border-purple-500/20 bg-zinc-950/20 text-purple-400 font-extrabold h-9 px-3 rounded-lg text-[9px] uppercase tracking-wider"
                  >
                    Revoke All Others
                  </Button>
                </div>

                <div className="space-y-3.5 text-xs font-bold">
                  {store.sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-black text-xs leading-none">{sess.device}</p>
                          {sess.isCurrent && (
                            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[7px] font-bold uppercase rounded-full">
                              Current Device
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-semibold leading-none">
                          {sess.browser} · IP: {sess.ip} · Activity: {sess.lastActivity}
                        </p>
                      </div>

                      {!sess.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 hover:text-purple-400 transition-colors"
                        >
                          Revoke Token
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 6. PRIVACY RULES */}
            {activeTab === "privacy" && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Privacy Configurations</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Toggle visibility filters across public standings feeds</span>
                </div>

                <div className="space-y-4 text-xs font-bold text-zinc-350">
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-xs leading-none">Public Profile visibility</p>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-1">Allow global users to inspect your public streaks and metrics profiles</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={store.privacy.profileVisibility === "PUBLIC"}
                      onChange={() => handleTogglePrivacy("profileVisibility")}
                      className="h-4.5 w-4.5 rounded border-zinc-850 text-purple-500 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-white font-black text-xs leading-none">Show on Leaderboards</p>
                      <span className="text-[9px] text-zinc-500 font-semibold block mt-1">Allow your name to list globally on standard master leaderboards standings</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={store.privacy.leaderboardVisibility}
                      onChange={() => handleTogglePrivacy("leaderboardVisibility")}
                      className="h-4.5 w-4.5 rounded border-zinc-850 text-purple-500 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 7. CONNECTED ACCOUNTS */}
            {activeTab === "connections" && (
              <motion.div
                key="connections"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Connected Accounts SSO</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Manage connected Clerk authentication providers</span>
                </div>

                <div className="space-y-3.5 text-xs font-bold">
                  {store.connections.map((c) => (
                    <div
                      key={c.provider}
                      className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {c.provider === "github" ? (
                          <Github className="h-5 w-5 text-white" />
                        ) : (
                          <Globe className="h-5 w-5 text-purple-400 animate-pulse" />
                        )}
                        <div>
                          <p className="text-white font-black text-xs uppercase leading-none">{c.provider} Linkage</p>
                          <p className="text-[9px] text-zinc-500 font-semibold mt-1">
                            {c.connected ? `Connected as: ${c.email}` : "Not connected"}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          const connects = !c.connected;
                          store.toggleConnection(c.provider, connects);
                          toast.success(connects ? `Connected to ${c.provider} SSO!` : `Disconnected ${c.provider} linkage.`);
                        }}
                        className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 font-extrabold h-9 text-[9px] rounded-lg gap-1 uppercase shrink-0"
                      >
                        {c.connected ? "Disconnect" : "Connect Account"}
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 8. AI MENTOR SETTINGS */}
            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">AI Preferences</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Configure cognitive masterclass preferences and recommendations</span>
                </div>

                <form onSubmit={handleUpdateAIPreferences} className="space-y-4 text-xs font-bold text-zinc-400">
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Primary learning goals</span>
                    <Input
                      type="text"
                      value={aiGoals}
                      onChange={(e) => setAiGoals(e.target.value)}
                      placeholder="e.g. Architect high-availability clusters"
                      className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-700 rounded-xl text-xs h-10 pl-3"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-extrabold h-10 px-6 rounded-xl text-xs gap-1 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lock In AI Preferences"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 9. DATA EXPORT */}
            {activeTab === "export" && (
              <motion.div
                key="export"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider">Data Export Center</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Trigger a secure ZIP credentials compile of your historical records</span>
                </div>

                <Card className="border-zinc-900 bg-zinc-900/25 p-5 flex flex-col justify-between min-h-[140px]">
                  <p className="text-[11px] text-zinc-550 font-bold leading-relaxed mb-4">
                    ✓ Generating an archive compiles profile specs, completed quizzes arrays, multiplayer match standing histories, and proctor blur warning histories.
                  </p>
                  <Button
                    onClick={handleDataExport}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold h-11 rounded-xl text-xs gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  >
                    <Download className="h-4.5 w-4.5" /> Compile & Download Data Archive ZIP
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* 10. DANGER ZONE */}
            {activeTab === "danger" && (
              <motion.div
                key="danger"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-900/60 pb-3">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider text-purple-400 animate-pulse">Danger Zone Operations</h2>
                  <span className="text-[8px] text-zinc-500 font-extrabold uppercase block mt-0.5">Irreversible administrative configurations</span>
                </div>

                <Card className="border-double border-2 border-purple-500/25 bg-purple-950/5 p-5 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                      Permanently Delete Account
                    </p>
                    <p className="text-[10px] text-zinc-550 font-semibold leading-relaxed">
                      This action is permanent and deletes all scores, streak milestones, unlocked badges, custom compiled roadmaps, and historic certificates.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 text-xs font-bold">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest pl-0.5 block">Type "DELETE" to unlock action</span>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="bg-zinc-950 border-zinc-900 text-white placeholder-zinc-800 rounded-xl text-xs h-10 pl-3 flex-1"
                      />
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmText !== "DELETE"}
                        className="bg-purple-500 hover:bg-purple-600 disabled:opacity-30 disabled:pointer-events-none text-white font-extrabold h-10 px-6 rounded-xl text-xs gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.15)] shrink-0"
                      >
                        <Trash2 className="h-4 w-4" /> Delete Account Permanently
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </Card>

      </div>
    </div>
  );
}
