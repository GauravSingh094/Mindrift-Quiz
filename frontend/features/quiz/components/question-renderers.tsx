"use client";

import React from "react";
import { Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Code } from "lucide-react";

interface RendererProps {
  question: Question;
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  disabled?: boolean;
}

// --- Multiple / Single Choice Renderer ---
export function ChoiceRenderer({
  question,
  selectedAnswer,
  onAnswerSelect,
  disabled = false,
}: RendererProps) {
  return (
    <div className="grid grid-cols-1 gap-3 w-full">
      {question.options.map((opt) => {
        const isSelected = selectedAnswer === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => !disabled && onAnswerSelect(opt.id)}
            disabled={disabled}
            type="button"
            className={`text-left p-4.5 rounded-2xl border transition-all duration-300 flex items-center justify-between select-none ${
              isSelected
                ? "bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/40 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "border-purple-500 bg-purple-500 text-white"
                    : "border-zinc-800 bg-zinc-950"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
              </div>
              <span className="text-sm font-semibold tracking-wide leading-relaxed">
                {opt.optionText}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// --- True / False Renderer ---
export function TrueFalseRenderer({
  question,
  selectedAnswer,
  onAnswerSelect,
  disabled = false,
}: RendererProps) {
  const choices = [
    { label: "True", value: "true" },
    { label: "False", value: "false" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {choices.map((choice) => {
        const isSelected = selectedAnswer === choice.value;
        return (
          <button
            key={choice.value}
            onClick={() => !disabled && onAnswerSelect(choice.value)}
            disabled={disabled}
            type="button"
            className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center h-[120px] select-none ${
              isSelected
                ? "bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/40 hover:text-zinc-200"
            }`}
          >
            <span className="text-lg font-black tracking-wide">{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// --- Fill in the Blank Renderer ---
export function FillBlankRenderer({
  selectedAnswer = "",
  onAnswerSelect,
  disabled = false,
}: Omit<RendererProps, "question"> & { question?: Question }) {
  return (
    <div className="w-full space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 pl-1">
        Your Answer Fill-in
      </label>
      <Input
        type="text"
        value={selectedAnswer}
        onChange={(e) => !disabled && onAnswerSelect(e.target.value)}
        disabled={disabled}
        placeholder="Type the correct missing keyword..."
        className="bg-zinc-950/40 border-zinc-900 text-white placeholder-zinc-700 focus-visible:ring-purple-500 h-12 rounded-xl text-sm"
      />
    </div>
  );
}

// --- Short Answer Renderer ---
export function ShortAnswerRenderer({
  selectedAnswer = "",
  onAnswerSelect,
  disabled = false,
}: Omit<RendererProps, "question"> & { question?: Question }) {
  return (
    <div className="w-full space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 pl-1">
        Your Explanatory Answer
      </label>
      <Textarea
        value={selectedAnswer}
        onChange={(e) => !disabled && onAnswerSelect(e.target.value)}
        disabled={disabled}
        placeholder="Enter your concise textual response..."
        className="bg-zinc-950/40 border-zinc-900 text-white placeholder-zinc-700 focus-visible:ring-purple-500 min-h-[120px] rounded-xl text-sm leading-relaxed"
      />
    </div>
  );
}

// --- Code Snippet Viewer / Editor Renderer ---
export function CodeSnippetRenderer({
  question,
  selectedAnswer,
  onAnswerSelect,
  disabled = false,
}: RendererProps) {
  // Try to find if question has standard choice options
  const hasOptions = question.options && question.options.length > 0;

  return (
    <div className="w-full space-y-4">
      {/* Code Block Showcase */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900/60 bg-zinc-950/80">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <Code className="h-4 w-4 text-purple-400" />
            <span>Interactive Code Console</span>
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <pre className="p-5 overflow-x-auto text-xs font-mono text-zinc-300 leading-relaxed max-h-[300px]">
          <code>
            {question.questionText.includes("```")
              ? question.questionText.split("```")[1]?.replace(/^[a-z]+\n/, "") || question.questionText
              : question.questionText}
          </code>
        </pre>
      </div>

      {hasOptions ? (
        <ChoiceRenderer
          question={question}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={onAnswerSelect}
          disabled={disabled}
        />
      ) : (
        <ShortAnswerRenderer
          selectedAnswer={selectedAnswer}
          onAnswerSelect={onAnswerSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
}
