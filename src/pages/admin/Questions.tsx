import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import { FileCode2, Calendar, ListChecks, ArrowRight } from "lucide-react";

export default function Questions() {
  const [, setLocation] = useLocation();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Setup Questions</h1>
          <p className="text-muted-foreground">
            Where to configure event RSVP questionnaires and AI Matchmaker / onboarding questions.
          </p>
        </div>

        {/* Event questionnaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event questionnaire (RSVP)
            </CardTitle>
            <CardDescription>
              Questions shown when attendees RSVP to an event. You can set them per event or use defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">In the app (per event)</h4>
              <p className="text-sm text-muted-foreground mb-2">
                When creating an event: enable &quot;Match questionnaire when attendees RSVP&quot; and use
                &quot;Set up questions&quot; to add or edit questions and options.
              </p>
              <Button variant="outline" size="sm" onClick={() => setLocation("/create-event")}>
                Create Event
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div>
              <h4 className="font-medium mb-1">In code (default questions)</h4>
              <p className="text-sm text-muted-foreground mb-1">
                Default questions used when an event has no custom questionnaire:
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded block w-fit">
                frontend-repo/src/lib/eventQuestionnaireDefaults.ts
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Matchmaking / onboarding flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Matchmaking flow questions
            </CardTitle>
            <CardDescription>
              The onboarding flow (&quot;Welcome to Your Matchmaking Journey&quot;) — styles, chapters, and option lists.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Where to edit</h4>
              <p className="text-sm text-muted-foreground mb-2">
                All onboarding flow content is defined in one file. Edit the following to change styles, chapters, and options:
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded block w-fit mb-2">
                frontend-repo/src/components/auth/OnboardingWizard.tsx
              </code>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li><strong>JOURNEY_STYLES</strong> — Fast & Fun, Deep & Thoughtful, Conversational</li>
                <li><strong>getChaptersForStyle()</strong> — Chapters and questions for each style</li>
                <li><strong>RELATIONSHIP_GOALS</strong>, <strong>VALUES</strong>, <strong>LIFESTYLE</strong>, <strong>INTERESTS</strong></li>
                <li><strong>EDUCATION_LEVELS</strong>, <strong>INCOME_RANGES</strong>, <strong>ZODIAC_SIGNS</strong></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Journey structure (read-only)</h4>
              <div className="text-sm text-muted-foreground grid gap-2">
                <div><strong>Fast & Fun</strong> — Quick Start, What You Want, Your Vibe, Ideal Day, Future Together, Photos, Blueprint</div>
                <div><strong>Deep & Thoughtful</strong> — Intro, Who You Are, What Matters, How You Connect, Ideal Day, Future Together, Photos, Blueprint</div>
                <div><strong>Conversational</strong> — Chat-style flow with the same topics</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <FileCode2 className="h-5 w-5" />
              Quick reference
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p><strong>Event questionnaire:</strong> Create Event page → &quot;Match questionnaire when attendees RSVP&quot; → &quot;Set up questions&quot;. Defaults: <code className="bg-muted px-1 rounded">eventQuestionnaireDefaults.ts</code>.</p>
            <p><strong>Journey questions:</strong> Edit <code className="bg-muted px-1 rounded">OnboardingWizard.tsx</code> (JOURNEY_STYLES, getChaptersForStyle, and the option constants listed above).</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
