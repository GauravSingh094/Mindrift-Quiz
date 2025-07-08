"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/mode-toggle';
import { 
  LayoutDashboard, 
  Trophy, 
  Plus, 
  Menu, 
  X,
  Brain,
  Settings,
  Shield,
  User,
  LogOut,
  Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { href: '/quizzes', label: 'Quizzes', icon: <Brain className="h-4 w-4 mr-2" /> },
    { href: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="h-4 w-4 mr-2" /> },
    { href: '/admin/created-quizzes', label: 'Created Quizzes', icon: <Settings className="h-4 w-4 mr-2" /> },
    { href: '/admin/competitions', label: 'Competitions', icon: <Target className="h-4 w-4 mr-2" /> },
    { href: '/admin/competition-control', label: 'Competition Control', icon: <Shield className="h-4 w-4 mr-2" /> },
  ];
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled || isMobileMenuOpen ? 'bg-black/70 backdrop-blur-lg border-b border-purple-900/20' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center mr-6">
              <div className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Mindrift</div>
            </Link>

            {user && (
              <nav className="hidden md:flex space-x-1">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant={pathname === link.href ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                    className="text-foreground dark:text-white hover:bg-accent"
                  >
                    <Link href={link.href}>
                      {link.icon}
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild className="text-foreground dark:text-white hover:bg-accent">
                  <Link href="/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Link>
                </Button>
                
                {/* NEW: Join Competition Button */}
                <Button variant="ghost" size="sm" asChild className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                  <Link href="/admin/competitions/join">
                    <Target className="h-4 w-4 mr-2" />
                    Join Competition
                  </Link>
                </Button>
              </div>
            )}

            <ModeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-foreground dark:text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="text-foreground dark:text-white">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/create" className="text-foreground dark:text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create Quiz</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/competitions/join" className="text-purple-400">
                      <Target className="mr-2 h-4 w-4" />
                      <span>Join Competition</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/created-quizzes" className="text-foreground dark:text-white">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/competitions" className="text-foreground dark:text-white">
                      <Target className="mr-2 h-4 w-4" />
                      <span>Competitions</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/competition-control" className="text-foreground dark:text-white">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Competition Control</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-foreground dark:text-white">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground dark:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  className="justify-start text-foreground dark:text-white hover:bg-accent"
                  onClick={() => setIsMobileMenuOpen(false)}
                  asChild
                >
                  <Link href={link.href}>
                    {link.icon}
                    {link.label}
                  </Link>
                </Button>
              ))}
              <Button
                variant="ghost"
                className="justify-start text-foreground dark:text-white hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
                asChild
              >
                <Link href="/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                onClick={() => setIsMobileMenuOpen(false)}
                asChild
              >
                <Link href="/admin/competitions/join">
                  <Target className="h-4 w-4 mr-2" />
                  Join Competition
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}