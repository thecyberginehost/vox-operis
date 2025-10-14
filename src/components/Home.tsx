import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Play, Star, Users, Mic, Video, Clock, Zap, ArrowRight, Sparkles } from "lucide-react";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";

interface HomeProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const Home = ({ onGetStarted, onSignIn }: HomeProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader onGetStarted={onGetStarted} onSignIn={onSignIn} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Transform your voice into opportunity</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-brand-gradient bg-clip-text text-transparent">
              Your voice, Your journey, Your Opportunity.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create professional voice-over profiles through guided steps and audio/video uploads. 
              Showcase your unique voice and story to unlock new opportunities in the growing voice industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="gap-2" onClick={onGetStarted}>
                <Play className="h-5 w-5" />
                Start Creating Your Profile
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <Video className="h-5 w-5" />
                Watch How It Works
              </Button>
            </div>
            
            <div className="mt-12 text-sm text-muted-foreground">
              Join <span className="text-primary font-semibold">2,500+</span> voice professionals already using Vox-Operis
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create your professional voice-over profile in just 4 simple steps. Our guided process helps you tell your story beautifully.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Headline & Intro",
                description: "Upload or record a short intro video showcasing your personality and voice. Make that crucial first impression count.",
                icon: Video,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02", 
                title: "My Journey",
                description: "Share your professional focus, approach, and unique value with audio statements that bring your story to life.",
                icon: Mic,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Career Overview", 
                description: "Build a compelling timeline of your career phases with audio narration that showcases your growth.",
                icon: Clock,
                color: "from-orange-500 to-red-500"
              },
              {
                step: "04",
                title: "How I Think",
                description: "Express your values and beliefs through thought cards with audio that reveals your unique perspective.",
                icon: Zap,
                color: "from-green-500 to-emerald-500"
              }
            ].map((step, index) => (
              <Card key={index} className="interactive-card p-6 text-center group">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-brand-gradient rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-sm font-mono text-primary mb-2">{step.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Voice Professionals</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Profiles Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">User Satisfaction</div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">Start for free, upgrade when you're ready to scale your voice career</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="elevated-card p-8">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Free Plan</h3>
                  <div className="text-4xl font-bold mb-2">$0</div>
                  <p className="text-muted-foreground">Perfect to get started</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>1 Voice-Over profile</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>2-minute video uploads</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Basic audio recording</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Profile sharing</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={onGetStarted}>Get Started Free</Button>
              </CardContent>
            </Card>

            <Card className="elevated-card p-8 border-primary glow-effect">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <div className="inline-block bg-brand-gradient text-primary-foreground px-3 py-1 rounded-full text-sm font-medium mb-4">
                    Most Popular
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
                  <div className="text-4xl font-bold mb-2">$29<span className="text-lg text-muted-foreground">/mo</span></div>
                  <p className="text-muted-foreground">For serious voice professionals</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Unlimited VO profiles</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>10-minute video uploads</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Advanced audio features</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Custom branding</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Analytics & insights</span>
                  </li>
                </ul>
                <Button variant="hero" className="w-full">Upgrade to Pro</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <Card className="elevated-card p-12 bg-brand-gradient">
            <CardContent className="p-0">
              <h2 className="text-4xl font-bold mb-4 text-primary-foreground">Ready to Launch Your Voice Career?</h2>
              <p className="text-xl mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
                Join thousands of voice professionals who are already using Vox-Operis to showcase their talent and land new opportunities.
              </p>
              <Button variant="secondary" size="lg" className="gap-2" onClick={onGetStarted}>
                <ArrowRight className="h-5 w-5" />
                Start Your Journey Today
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
};

export default Home;