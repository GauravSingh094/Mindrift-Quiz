"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trophy, 
  Shield, 
  Clock, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Loader2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES, DIFFICULTIES } from '@/lib/mock-data';
import { FirestoreService, generateCompetitionCode } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth-context';
import { Timestamp } from 'firebase/firestore';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  categories: z.array(z.string()).min(1, 'Please select at least one category'),
  difficulty: z.string().min(1, 'Please select difficulty'),
  scheduledAt: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, 'Scheduled time must be in the future'),
  duration: z.number().min(30, 'Minimum 30 minutes').max(300, 'Maximum 5 hours'),
  totalQuestions: z.number().min(10, 'Minimum 10 questions').max(100, 'Maximum 100 questions'),
  maxParticipants: z.number().min(10, 'Minimum 10 participants').max(10000, 'Maximum 10,000 participants'),
  instructions: z.string().optional(),
  antiCheat: z.object({
    copyPasteLock: z.boolean(),
    tabSwitchLimit: z.number().min(0).max(10),
    cooldownPeriod: z.number().min(0).max(60)
  })
});

type FormData = z.infer<typeof formSchema>;

interface NewCompetitionFormProps {
  onSubmit?: (data: FormData & { competitionCode: string }) => void;
  onCancel?: () => void;
}

export function NewCompetitionForm({ onSubmit, onCancel }: NewCompetitionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      categories: [],
      difficulty: '',
      scheduledAt: '',
      duration: 120,
      totalQuestions: 50,
      maxParticipants: 1000,
      instructions: '',
      antiCheat: {
        copyPasteLock: true,
        tabSwitchLimit: 3,
        cooldownPeriod: 30
      }
    }
  });

  const generateCompetitionCodeHandler = () => {
    const code = generateCompetitionCode();
    setGeneratedCode(code);
    return code;
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast({
        title: "Code Copied",
        description: "Competition code copied to clipboard",
      });
    }
  };

  async function handleSubmit(values: FormData) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be logged in to create a competition.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate competition code
      const competitionCode = generateCompetitionCodeHandler();
      
      // Create competition data
      const competitionData = {
        title: values.title.trim(),
        description: values.description.trim(),
        categories: values.categories,
        difficulty: values.difficulty,
        scheduledAt: Timestamp.fromDate(new Date(values.scheduledAt)),
        duration: values.duration,
        totalQuestions: values.totalQuestions,
        maxParticipants: values.maxParticipants,
        instructions: values.instructions?.trim(),
        competitionCode,
        antiCheat: values.antiCheat,
        createdBy: user.id
      };
      
      console.log('💾 Creating competition:', competitionData);
      
      // Save to Firestore
      const competitionId = await FirestoreService.createCompetition(competitionData);
      
      toast({
        title: "Competition Created!",
        description: `"${values.title}" has been scheduled successfully.`,
      });
      
      // Call parent handler if provided
      if (onSubmit) {
        onSubmit({ ...values, competitionCode });
      }
      
      // Redirect to competition dashboard
      setTimeout(() => {
        router.push(`/admin/competitions/${competitionCode}/dashboard`);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error creating competition:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create competition. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleCategory = (categoryId: string) => {
    const currentCategories = form.getValues('categories');
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    form.setValue('categories', newCategories);
  };

  const removeCategory = (categoryId: string) => {
    const currentCategories = form.getValues('categories');
    const newCategories = currentCategories.filter(id => id !== categoryId);
    form.setValue('categories', newCategories);
  };

  const selectedCategories = form.watch('categories');

  return (
    <div className="space-y-8">
      <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Create New Competition
          </CardTitle>
          <CardDescription>
            Set up a competitive quiz event with advanced anti-cheat measures and real-time monitoring
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Competition Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., React Championship 2024" 
                            disabled={isSubmitting}
                            className="text-foreground dark:text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a compelling title for your competition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Difficulty Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger className="text-foreground dark:text-white">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIFFICULTIES.map((difficulty) => (
                              <SelectItem key={difficulty.id} value={difficulty.id}>
                                <span className={difficulty.color}>{difficulty.name}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the competition objectives, rules, and what participants can expect..."
                          className="resize-none text-foreground dark:text-white"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide clear information about the competition format and expectations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categories Selection */}
                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-white">Categories</FormLabel>
                      <FormDescription>
                        Select one or more categories for your competition
                      </FormDescription>
                      
                      {/* Selected Categories Display */}
                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-black/20 dark:bg-black/20 bg-gray-50 rounded-lg border">
                          {selectedCategories.map((categoryId) => {
                            const category = CATEGORIES.find(c => c.id === categoryId);
                            return (
                              <Badge 
                                key={categoryId} 
                                variant="secondary" 
                                className="flex items-center gap-1 text-foreground dark:text-white"
                              >
                                {category?.name}
                                <button
                                  type="button"
                                  onClick={() => removeCategory(categoryId)}
                                  className="ml-1 hover:text-red-400"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Category Selection Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-3 bg-black/10 dark:bg-black/10 bg-gray-50 rounded-lg border">
                        {CATEGORIES.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={category.id}
                              checked={selectedCategories.includes(category.id)}
                              onCheckedChange={() => toggleCategory(category.id)}
                              disabled={isSubmitting}
                            />
                            <label
                              htmlFor={category.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground dark:text-white"
                            >
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Competition Settings */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  Competition Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Scheduled Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            disabled={isSubmitting}
                            className="text-foreground dark:text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          When the competition will automatically begin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="30"
                            max="300"
                            disabled={isSubmitting}
                            className="text-foreground dark:text-white"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Total time allowed for the competition (30-300 minutes)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalQuestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Total Questions</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="10"
                            max="100"
                            disabled={isSubmitting}
                            className="text-foreground dark:text-white"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of questions in the competition (10-100)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Max Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="10"
                            max="10000"
                            disabled={isSubmitting}
                            className="text-foreground dark:text-white"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of participants allowed (10-10,000)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Anti-Cheat Rules */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  Anti-Cheat Measures
                </h3>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-400 mb-1">Security Notice</h4>
                      <p className="text-sm text-yellow-300">
                        These measures help maintain competition integrity. Participants will be warned about restrictions before starting.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="antiCheat.copyPasteLock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-purple-900/20 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-foreground dark:text-white">Copy/Paste Lock</FormLabel>
                          <FormDescription>
                            Prevent copying and pasting during the competition
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="antiCheat.tabSwitchLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Tab Switch Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            disabled={isSubmitting}
                            className="text-foreground dark:text-white"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum allowed tab switches (0 = unlimited)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="antiCheat.cooldownPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground dark:text-white">Cooldown Period (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="60"
                            disabled={isSubmitting}
                            className="text-foreground dark:text-white"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Penalty time for rule violations (0 = no cooldown)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Optional Instructions */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-400" />
                  Additional Settings
                </h3>
                
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-white">Special Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special rules, guidelines, or information participants should know..."
                          className="resize-none text-foreground dark:text-white"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Additional instructions or rules specific to this competition
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Generated Code Display */}
              {generatedCode && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-400 mb-1">Competition Code Generated</h4>
                      <div className="font-mono text-lg text-green-300">{generatedCode}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyCode}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Competition...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create Competition
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel || (() => router.back())}
            disabled={isSubmitting}
            className="w-full sm:w-auto text-foreground dark:text-white border-border hover:bg-accent"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}