"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RechartsAreaWrapper, RechartsLineWrapper } from "@/components/ui/chart-wrappers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Award, Calendar, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const performanceData = [
  { date: "May 25", quizzes: 2, score: 75, points: 250 },
  { date: "May 26", quizzes: 4, score: 80, points: 500 },
  { date: "May 27", quizzes: 3, score: 85, points: 400 },
  { date: "May 28", quizzes: 5, score: 92, points: 650 },
  { date: "May 29", quizzes: 6, score: 88, points: 700 },
  { date: "May 30", quizzes: 4, score: 90, points: 550 },
  { date: "May 31", quizzes: 3, score: 95, points: 400 },
];

const categoryData = [
  { category: "Frontend", count: 8, avgScore: 88 },
  { category: "Backend", count: 12, avgScore: 82 },
  { category: "AI", count: 6, avgScore: 90 },
  { category: "System Design", count: 4, avgScore: 78 },
  { category: "Python", count: 7, avgScore: 85 },
];

export function AnalyticsSection() {
  const [activeTab, setActiveTab] = useState("learning");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card className="border-zinc-900 bg-zinc-950/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 via-transparent to-transparent pointer-events-none" />

        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900/50">
          <div>
            <CardTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              <span>Performance Analytics</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 font-semibold mt-0.5">
              Visualize your competency growth and subject distributions.
            </CardDescription>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-zinc-900/60 border border-zinc-900 p-0.5 rounded-xl flex">
              <TabsTrigger
                value="learning"
                className="rounded-lg text-xs font-bold px-3.5 py-1.5 data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400"
              >
                Learning Track
              </TabsTrigger>
              <TabsTrigger
                value="accuracy"
                className="rounded-lg text-xs font-bold px-3.5 py-1.5 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400"
              >
                Accuracy
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="rounded-lg text-xs font-bold px-3.5 py-1.5 data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-400"
              >
                Categories
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs value={activeTab} className="w-full">
            {/* Learning Track Area Chart */}
            <TabsContent value="learning" className="outline-none">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span>XP / Points Accumulated Daily (Last 7 Days)</span>
                </div>
                <RechartsAreaWrapper
                  data={performanceData}
                  dataKey="points"
                  categoryKey="date"
                  height={280}
                  glowColor="purple"
                />
              </div>
            </TabsContent>

            {/* Accuracy Line Chart */}
            <TabsContent value="accuracy" className="outline-none">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  <Award className="h-4 w-4 text-cyan-400 animate-pulse" />
                  <span>Daily Quiz Score Percentages (Last 7 Days)</span>
                </div>
                <RechartsLineWrapper
                  data={performanceData}
                  dataKey="score"
                  categoryKey="date"
                  height={280}
                  glowColor="green"
                />
              </div>
            </TabsContent>

            {/* Category Performance Bar Chart */}
            <TabsContent value="categories" className="outline-none">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  <span>Quiz Completed & Accuracy Rates by Category</span>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(24, 24, 27, 0.4)" vertical={false} />
                      <XAxis
                        dataKey="category"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontSize: "11px", fontWeight: "bold" }}
                        itemStyle={{ color: "#f59e0b", fontSize: "12px" }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AnalyticsSection;
