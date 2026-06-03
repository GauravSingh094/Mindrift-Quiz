"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";

export default function CreateQuizPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Create Quiz</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md hover:bg-black/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-blue-400" />
                Create New Quiz
              </CardTitle>
              <CardDescription>
                Design your own quiz with custom questions and answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Create a personalized quiz from scratch. Set questions, answers, time limits, and more.
              </p>
              <Button asChild className="w-full">
                <Link href="/create/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Start Creating
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md hover:bg-black/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-400" />
                Join Quiz
              </CardTitle>
              <CardDescription>
                Enter a quiz ID to join an existing session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Have a quiz ID? Join an existing quiz session to participate with others.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/create/join">
                  <Users className="mr-2 h-4 w-4" />
                  Join Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}