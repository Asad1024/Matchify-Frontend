import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Heart, X, Check, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/services/api";
import { useCurrentUser } from "@/contexts/UserContext";

interface Question {
  id: string;
  text: string;
  options: string[];
  required: boolean;
}

interface EventMatchQuestionnaireProps {
  eventId: string;
  eventTitle: string;
  questions: Question[];
  onComplete: () => void;
  onCancel: () => void;
  /** When editing, pre-fill form with these answers */
  initialAnswers?: Record<string, string>;
}

export default function EventMatchQuestionnaire({
  eventId,
  eventTitle,
  questions,
  onComplete,
  onCancel,
  initialAnswers,
}: EventMatchQuestionnaireProps) {
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Pre-fill answers when opening for edit (initialAnswers or when they change)
  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  const submitMutation = useMutation({
    mutationFn: async (data: { userId: string; eventId: string; answers: Record<string, string> }) => {
      const url = buildApiUrl(`/api/events/${eventId}/questionnaire`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to submit questionnaire (${res.status})`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        toast({
          title: "Questionnaire submitted! ✅",
          description: "Your answers have been saved. Matches will be revealed at the event!",
        });
        onComplete();
      }, 2000);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      console.error('Questionnaire submission error:', error);
      const errorMessage = error.message || "Please try again. Make sure you're logged in and all required questions are answered.";
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const canProceed = currentQuestion.required 
    ? answers[currentQuestion.id]?.trim() 
    : true;

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last question - validate all required answers before submitting
      const allRequiredAnswered = questions.every(q => 
        !q.required || (answers[q.id] && answers[q.id].trim())
      );
      
      if (!allRequiredAnswered) {
        toast({
          title: "Please answer all required questions",
          description: "Some required questions are missing answers.",
          variant: "destructive",
        });
        return;
      }
      
      // Submit questionnaire
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit your questionnaire",
        variant: "destructive",
      });
      return;
    }

    // Validate all required questions are answered
    const allRequiredAnswered = questions.every(q => 
      !q.required || (answers[q.id] && answers[q.id].trim())
    );
    
    if (!allRequiredAnswered) {
      toast({
        title: "Please answer all required questions",
        description: "Some required questions are missing answers.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate({
      userId,
      eventId,
      answers,
    });
  };

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold && currentStep > 0) {
      handleBack();
    } else if (info.offset.x < -threshold && canProceed) {
      handleNext();
    }
    setDragX(0);
    setIsDragging(false);
  };

  // Success screen with confetti effect
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="border-primary/50 shadow-2xl overflow-hidden">
          <CardContent className="p-12 text-center relative">
            {/* Confetti particles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 5],
                }}
                initial={{
                  x: "50%",
                  y: "50%",
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  opacity: 0,
                  scale: 0,
                  rotate: 360,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-2"
            >
              All Set! 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg"
            >
              Your answers have been saved. Matches will be revealed at the event!
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center justify-center gap-2 text-primary"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-medium">Preparing your matches...</span>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">Question {currentStep + 1} of {questions.length}</span>
            <span className="text-primary font-bold">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-muted/50"
          />
        </div>

        {/* Question Card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDrag={(_, info) => setDragX(info.offset.x)}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ 
            scale: isDragging ? 1.02 : 1, 
            opacity: 1,
            x: dragX,
            rotate: dragX * 0.1,
          }}
          exit={{ scale: 0.95, opacity: 0, x: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative"
          style={{ touchAction: "pan-y" }}
        >
          <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                </motion.div>
                <div className="flex-1">
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Match Questionnaire
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Help us find your perfect match at <span className="font-semibold text-primary">{eventTitle}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  {/* Question Number Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    >
                      {currentStep + 1}
                    </motion.div>
                    <div className="flex-1">
                      <Label className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                        {currentQuestion.text}
                        {currentQuestion.required && (
                          <span className="text-destructive ml-2">*</span>
                        )}
                      </Label>
                    </div>
                  </div>

                  {/* Answer Options */}
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                      <RadioGroup
                        value={answers[currentQuestion.id] || ""}
                        onValueChange={handleAnswerChange}
                        className="space-y-3"
                      >
                        {currentQuestion.options.map((option, index) => {
                          const isSelected = answers[currentQuestion.id] === option;
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + index * 0.05 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              whileTap={{ scale: 0.98 }}
                              className="relative"
                            >
                              <div
                                className={`
                                  flex items-center space-x-4 p-4 md:p-5 rounded-xl border-2 transition-all cursor-pointer
                                  ${isSelected 
                                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                                    : 'border-primary/20 hover:border-primary/50 hover:bg-primary/5 bg-card/50'
                                  }
                                `}
                                onClick={() => handleAnswerChange(option)}
                              >
                                <RadioGroupItem 
                                  value={option} 
                                  id={`option-${index}`}
                                  className="border-2 border-primary/50"
                                />
                                <Label 
                                  htmlFor={`option-${index}`} 
                                  className="flex-1 cursor-pointer text-base md:text-lg font-medium group-hover:text-primary transition-colors"
                                >
                                  {option}
                                </Label>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="text-primary"
                                  >
                                    <CheckCircle2 className="w-6 h-6 fill-primary" />
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </RadioGroup>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <p>No options available for this question.</p>
                    </motion.div>
                  )}

                  {/* Swipe Hint */}
                  {currentStep > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Swipe left to go back</span>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <motion.div 
            className="flex justify-between items-center mt-6 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onCancel : handleBack}
              disabled={isSubmitting || submitMutation.isPending}
              className="min-w-[120px] border-2 hover:bg-primary/10 hover:border-primary transition-all"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 0 ? "Cancel" : "Back"}
            </Button>

            <div className="flex items-center gap-2">
              {canProceed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 text-primary text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  <span>Ready</span>
                </motion.div>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed || isSubmitting || submitMutation.isPending}
                className="min-w-[140px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {isSubmitting || submitMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Submitting...
                  </>
                ) : currentStep === questions.length - 1 ? (
                  <>
                    Submit <Zap className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
