import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SpaceBackground } from '@/components/animations/space-background';
import { ArrowRight, Brain, Trophy, Users } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">
      <SpaceBackground />
      
      <div className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center relative z-10">
        <div className="max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              Mindrift
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            An immersive quiz platform with stunning 3D visuals for interactive learning and competitive challenges
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg">
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-950 hover:text-purple-300">
              <Link href="/register">
                Create Account
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="bg-black/40 backdrop-blur-lg p-6 rounded-xl border border-purple-900/40 flex flex-col items-center text-center hover:border-purple-600/40 transition-all">
            <div className="h-14 w-14 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Customizable Quizzes</h3>
            <p className="text-gray-400">Create and join quizzes with various categories and difficulty levels</p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-lg p-6 rounded-xl border border-purple-900/40 flex flex-col items-center text-center hover:border-purple-600/40 transition-all">
            <div className="h-14 w-14 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Competitions</h3>
            <p className="text-gray-400">Participate in real-time quiz events with thousands of participants</p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-lg p-6 rounded-xl border border-purple-900/40 flex flex-col items-center text-center hover:border-purple-600/40 transition-all">
            <div className="h-14 w-14 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Global Leaderboards</h3>
            <p className="text-gray-400">Compete for top positions and track your progress over time</p>
          </div>
        </div>
      </div>
      
      <footer className="relative z-10 py-6 border-t border-gray-800 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <div className="space-y-3">
            <p className="text-sm md:text-base text-gray-400">
              © 2025 Mindrift. All rights reserved. | Developed by <strong className="text-gray-300">Gaurav Singh</strong>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
              <a 
                href="https://www.linkedin.com/in/gaurav-singh-276944292?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline flex items-center gap-1"
              >
                💼 LinkedIn
              </a>
              <span className="hidden sm:inline text-gray-600">|</span>
              <a 
                href="mailto:gauravsinghx2510@gmail.com"
                className="text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline flex items-center gap-1"
              >
                📧 gauravsinghx2510@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}