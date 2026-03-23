import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQ_RESPONSES: Record<string, string> = {
  "how to match": "To find matches, go to the Directory page and use filters. You can also try our AI Matchmaker for personalized matches!",
  "subscription": "We offer Free, Premium ($29/mo), Elite ($49/mo), and Diamond ($99/mo) plans. Check the Subscriptions page for details.",
  "report": "To report a user, go to their profile and click the three dots menu, then select 'Report User'.",
  "block": "To block someone, go to their profile, click the three dots menu, and select 'Block User'.",
  "help": "I can help with matching, subscriptions, reporting, blocking, and more. What do you need?",
  "settings": "You can access settings from your Profile page. There you can manage privacy, notifications, and account settings.",
  "profile": "To edit your profile, go to the Profile tab and click the edit button. You can update your photos, bio, and preferences.",
};

export function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isBot: boolean }>>([
    { text: "Hi! I'm Matchify Support. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { text: input, isBot: false }]);
    
    const lowerInput = input.toLowerCase();
    let response = "I'm here to help! Try asking about matching, subscriptions, reporting, blocking users, settings, or profile editing.";
    
    for (const [keyword, answer] of Object.entries(FAQ_RESPONSES)) {
      if (lowerInput.includes(keyword)) {
        response = answer;
        break;
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { text: response, isBot: true }]);
    }, 500);

    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <Button
        className="fixed top-1/2 -translate-y-1/2 right-4 w-14 h-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="fixed top-1/2 -translate-y-1/2 right-16 w-80 h-96 bg-card border rounded-lg shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-semibold">Matchify Support</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg ${
                      msg.isBot
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

