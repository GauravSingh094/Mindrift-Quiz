"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Loader2, Timer, HelpCircle, Users, Calendar, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { CATEGORIES, DIFFICULTIES } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Category, Quiz } from "@/lib/types";
import { addCreatedQuiz } from "@/lib/created-quizzes-data";
import { generateUniqueQuizCode } from "@/lib/created-quizzes-data";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }).max(100, {
    message: "Title must not exceed 100 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must not exceed 500 characters.",
  }),
  categories: z.array(z.string()).min(1, {
    message: "Please select at least one category.",
  }),
  difficulty: z.string({
    required_error: "Please select a difficulty level.",
  }),
  timePerQuestion: z.number().min(60, {
    message: "Time per question must be at least 60 seconds.",
  }).max(300, {
    message: "Time per question cannot exceed 5 minutes.",
  }),
  maxParticipants: z.number().min(1, {
    message: "Must allow at least 1 participant.",
  }).max(1000, {
    message: "Cannot exceed 1000 participants.",
  }),
  startTime: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, {
    message: "Start time must be in the future.",
  }),
  questionCount: z.number().min(5, {
    message: "Quiz must have at least 5 questions.",
  }).max(50, {
    message: "Quiz cannot exceed 50 questions.",
  }),
  isLive: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface CreateQuizState {
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  createdQuizId: string | null;
  createdQuizCode: string | null;
}

export default function NewQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [createState, setCreateState] = useState<CreateQuizState>({
    isSubmitting: false,
    submitError: null,
    submitSuccess: false,
    createdQuizId: null,
    createdQuizCode: null,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      categories: [],
      timePerQuestion: 60,
      maxParticipants: 100,
      questionCount: 10,
      isLive: false,
    },
  });

  // Mock function to simulate quiz creation API call
  const createQuizAPI = async (quizData: FormData): Promise<{ success: boolean; quizId?: string; quizCode?: string; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random success/failure for demo
    const success = Math.random() > 0.05; // 95% success rate
    
    if (success) {
      const quizCode = generateUniqueQuizCode();
      const quizId = `created-quiz-${Date.now()}`;
      return { success: true, quizId, quizCode };
    } else {
      return { success: false, error: "Failed to create quiz. Please try again." };
    }
  };

  async function onSubmit(values: FormData) {
    if (createState.isSubmitting) return;

    setCreateState({
      isSubmitting: true,
      submitError: null,
      submitSuccess: false,
      createdQuizId: null,
      createdQuizCode: null,
    });

    try {
      // Validate form data
      if (!values.title.trim()) {
        throw new Error("Quiz title is required");
      }
      
      if (values.categories.length === 0) {
        throw new Error("At least one category must be selected");
      }

      // Call API to create quiz
      const result = await createQuizAPI(values);
      
      if (result.success && result.quizId && result.quizCode) {
        // Create quiz object
        const newQuiz: Quiz = {
          id: result.quizId,
          title: values.title.trim(),
          description: values.description.trim(),
          categories: values.categories as Category[],
          difficulty: values.difficulty as any,
          timePerQuestion: values.timePerQuestion,
          maxParticipants: values.maxParticipants,
          questionCount: values.questionCount,
          isLive: false, // Created quizzes start as scheduled
          startTime: new Date(values.startTime),
          createdAt: new Date(),
          updatedAt: new Date(),
          currentParticipants: 0,
          status: 'scheduled', // All created quizzes start as scheduled
          createdById: 'current-user-id', // In real app, get from auth context
          quizCode: result.quizCode, // Add the generated quiz code
        };

        // Add to created quizzes store
        addCreatedQuiz(newQuiz);
        
        setCreateState({
          isSubmitting: false,
          submitError: null,
          submitSuccess: true,
          createdQuizId: result.quizId,
          createdQuizCode: result.quizCode,
        });

        toast({
          title: "Success!",
          description: `Quiz "${values.title}" has been created and scheduled successfully.`,
        });

        // Redirect to created quizzes page after a delay
        setTimeout(() => {
          router.push("/admin/created-quizzes");
        }, 3000);
        
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create quiz. Please try again.";
      
      setCreateState({
        isSubmitting: false,
        submitError: errorMessage,
        submitSuccess: false,
        createdQuizId: null,
        createdQuizCode: null,
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  }

  const copyQuizCode = () => {
    if (createState.createdQuizCode) {
      navigator.clipboard.writeText(createState.createdQuizCode);
      toast({
        title: "Quiz Code Copied",
        description: "Quiz code has been copied to clipboard",
      });
    }
  };

  if (createState.submitSuccess) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-green-400">Quiz Created Successfully!</CardTitle>
              <CardDescription>
                Your quiz has been scheduled and will automatically become active at the specified time.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Quiz ID</p>
                <p className="font-mono text-lg font-bold">{createState.createdQuizId}</p>
              </div>
              
              {createState.createdQuizCode && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-400 font-medium">Quiz Code</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyQuizCode}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-mono text-2xl font-bold text-green-300">{createState.createdQuizCode}</p>
                  <p className="text-xs text-green-400 mt-2">
                    Share this code with participants to join your quiz
                  </p>
                </div>
              )}
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-300 space-y-1 text-left">
                  <li>• Your quiz is now scheduled and will activate automatically</li>
                  <li>• Participants can join using the Quiz Code once it's active</li>
                  <li>• You can monitor and manage it in the Created Quizzes section</li>
                  <li>• The quiz code can be shared with participants in advance</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                Redirecting to Created Quizzes in a few seconds...
              </p>
            </CardContent>
            <CardFooter className="flex gap-4 justify-center">
              <Button onClick={() => router.push("/admin/created-quizzes")}>
                View Created Quizzes
              </Button>
              <Button variant="outline" onClick={() => router.push("/create/new")}>
                Create Another Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-6 w-6" />
              Create New Quiz
            </CardTitle>
            <CardDescription>
              Design your own quiz with custom questions and answers. It will be scheduled and automatically activated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createState.submitError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-400">Error Creating Quiz</h4>
                  <p className="text-sm text-red-300 mt-1">{createState.submitError}</p>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter quiz title" 
                          disabled={createState.isSubmitting}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Give your quiz a clear and descriptive title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what your quiz is about"
                          className="resize-none"
                          disabled={createState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a brief overview of the quiz content and objectives
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categories"
                  render={() => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {CATEGORIES.map((category) => (
                          <FormField
                            key={category.id}
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={category.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(category.id)}
                                      disabled={createState.isSubmitting}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, category.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== category.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-sm">
                                    {category.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormDescription>
                        Select one or more categories for your quiz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={createState.isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIFFICULTIES.map((difficulty) => (
                              <SelectItem 
                                key={difficulty.id} 
                                value={difficulty.id}
                                className={difficulty.color}
                              >
                                {difficulty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the challenge level of your quiz
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="questionCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="5"
                              max="50"
                              disabled={createState.isSubmitting}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Number of questions in the quiz (5-50)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="timePerQuestion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time per Question (seconds)</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="60"
                              max="300"
                              disabled={createState.isSubmitting}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 60)}
                            />
                            <Timer className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Set how long participants have to answer each question (60-300 seconds)
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
                        <FormLabel>Maximum Participants</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="1"
                              max="1000"
                              disabled={createState.isSubmitting}
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            />
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Set the maximum number of participants (1-1000)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Start Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="datetime-local"
                            disabled={createState.isSubmitting}
                            {...field}
                          />
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Schedule when the quiz will automatically become active and joinable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start space-x-2">
                  <HelpCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-400">Automatic Activation & Quiz Code</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your quiz will be created with "scheduled" status and will automatically become active at the specified time. 
                      A unique quiz code will be generated that participants can use to join once the quiz is active.
                    </p>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createState.isSubmitting}
              className="w-full sm:w-auto"
            >
              {createState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Quiz...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Scheduled Quiz
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={createState.isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}