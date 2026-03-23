import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, Sparkles, Calendar, 
  CheckCircle, ArrowRight, Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostMatchGuidanceProps {
  match: {
    id: string;
    name: string;
    compatibility: number;
    sharedInterests?: string[];
    loveLanguage?: string;
  };
  onDateScheduled?: () => void;
  onMessageSent?: () => void;
}

export default function PostMatchGuidance({ match, onDateScheduled, onMessageSent }: PostMatchGuidanceProps) {
  const [showConversationStarters, setShowConversationStarters] = useState(false);
  const [showDateCheckIn, setShowDateCheckIn] = useState(false);
  const [dateFeedback, setDateFeedback] = useState("");
  const { toast } = useToast();

  // Generate conversation starters based on shared interests
  const conversationStarters = match.sharedInterests?.length 
    ? [
        `I noticed we both love ${match.sharedInterests[0]}. What got you into it?`,
        `I see we share an interest in ${match.sharedInterests[1] || match.sharedInterests[0]}. Tell me more about that!`,
        `Based on your profile, I think we'd have great conversations about ${match.sharedInterests[0]}.`,
      ]
    : [
        "I'd love to learn more about what makes you tick. What are you passionate about?",
        "Your profile caught my attention. What's something you're excited about right now?",
        "I'm curious - what's a typical day like for you?",
      ];

  const handleSendMessage = (starter: string) => {
    // In a real app, this would send the message
    toast({
      title: "Message ready! 💬",
      description: "Copy this to start your conversation",
    });
    onMessageSent?.();
  };

  const handleDateFeedbackSubmit = () => {
    if (!dateFeedback.trim()) {
      toast({
        title: "Please share your thoughts",
        description: "Your feedback helps us improve matching",
        variant: "destructive",
      });
      return;
    }

    // Analyze feedback for insights
    const positiveKeywords = ['great', 'good', 'amazing', 'wonderful', 'enjoyed', 'liked'];
    const negativeKeywords = ['bad', 'awkward', 'uncomfortable', 'didn\'t like', 'boring'];

    const isPositive = positiveKeywords.some(keyword => 
      dateFeedback.toLowerCase().includes(keyword)
    );
    const isNegative = negativeKeywords.some(keyword => 
      dateFeedback.toLowerCase().includes(keyword)
    );

    toast({
      title: "Feedback received! 📝",
      description: isPositive 
        ? "Glad it went well! We'll use this to find similar matches."
        : isNegative
        ? "Thanks for the honest feedback. We'll help you find better connections."
        : "Thanks for sharing. Every experience helps us learn.",
    });

    setDateFeedback("");
    setShowDateCheckIn(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">You Matched with {match.name}! 🎉</h2>
        <p className="text-muted-foreground">
          {match.compatibility}% compatibility - Here's how to make the most of this connection
        </p>
      </div>

      {/* Conversation Starters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Conversation Starters</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConversationStarters(!showConversationStarters)}
            >
              {showConversationStarters ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showConversationStarters && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Based on your shared interests and compatibility, here are some conversation starters:
              </p>
              {conversationStarters.map((starter, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm mb-3">{starter}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendMessage(starter)}
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Use This Starter
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Love Language Tip */}
      {match.loveLanguage && (
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Love Language Insight</h3>
                <p className="text-sm text-muted-foreground">
                  Their love language is <strong>{match.loveLanguage}</strong>. 
                  Keep this in mind when showing interest - they'll appreciate gestures that align with this.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Planning */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Planning Your First Date</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <p>Choose a public place for the first meeting</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <p>Keep it casual - coffee or a walk works great</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <p>Be yourself - authenticity is attractive</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <p>Ask open-ended questions to keep conversation flowing</p>
            </div>
          </div>
          <Button
            className="w-full mt-4"
            onClick={() => {
              toast({
                title: "Date planning tips saved! 📅",
                description: "Good luck on your date!",
              });
              onDateScheduled?.();
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            I'm Ready to Plan
          </Button>
        </CardContent>
      </Card>

      {/* Post-Date Check-In */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Post-Date Check-In</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDateCheckIn(!showDateCheckIn)}
            >
              {showDateCheckIn ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showDateCheckIn && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How did your date go? Your feedback helps us understand what works and improve future matches.
              </p>
              <Textarea
                placeholder="Share your thoughts about the date... What went well? What could be better?"
                value={dateFeedback}
                onChange={(e) => setDateFeedback(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleDateFeedbackSubmit}
                className="w-full"
                disabled={!dateFeedback.trim()}
              >
                Submit Feedback
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compatibility Insights */}
      <Card className="bg-gradient-to-br from-primary/10 to-pink-500/10">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Why You Match</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default">{match.compatibility}%</Badge>
              <span>Overall Compatibility</span>
            </div>
            {match.sharedInterests && match.sharedInterests.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{match.sharedInterests.length}</Badge>
                <span>Shared Interests</span>
              </div>
            )}
            <p className="text-muted-foreground mt-3">
              This match was selected based on your AI Matchmaker profile, ensuring alignment 
              with your values, priorities, and relationship goals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

