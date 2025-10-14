import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mic, Video, Clock, Zap, Upload, Users, Shield, 
  BarChart3, Palette, Share2, Star, Headphones,
  Globe, Smartphone, Download
} from "lucide-react";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";

interface FeaturesProps {
  onGetStarted?: () => void;
}

const Features = ({ onGetStarted }: FeaturesProps) => {
  const coreFeatures = [
    {
      icon: Video,
      title: "Video Intro Creation",
      description: "Upload or record professional intro videos up to 10 minutes. Showcase your personality and voice quality with high-definition video support.",
      category: "Content Creation"
    },
    {
      icon: Mic,
      title: "Audio Storytelling",
      description: "Create compelling audio narratives for each section of your profile. Professional audio processing and noise reduction included.",
      category: "Content Creation"
    },
    {
      icon: Clock,
      title: "Career Timeline Builder",
      description: "Build dynamic career timelines with audio narration. Showcase your professional growth and key milestones.",
      category: "Profile Building"
    },
    {
      icon: Zap,
      title: "Thought Cards",
      description: "Express your values and beliefs through interactive thought cards with audio recordings and custom tags.",
      category: "Profile Building"
    },
    {
      icon: Upload,
      title: "Multi-Format Upload",
      description: "Support for MP4, MOV, WebM videos and MP3, WAV audio files. Drag-and-drop interface with batch uploading.",
      category: "Technical"
    },
    {
      icon: Users,
      title: "Profile Sharing",
      description: "Share your profiles with custom URLs. Embed profiles on websites and generate shareable previews for social media.",
      category: "Sharing"
    }
  ];

  const advancedFeatures = [
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track profile views, engagement metrics, and conversion rates. Understand who's viewing your profile and when.",
      badge: "Pro"
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Personalize your profiles with custom colors, fonts, and logos. Create a consistent brand experience.",
      badge: "Pro"
    },
    {
      icon: Shield,
      title: "Privacy Controls",
      description: "Control who can view your profiles with password protection, expiry dates, and viewer restrictions.",
      badge: "Pro"
    },
    {
      icon: Share2,
      title: "Advanced Sharing",
      description: "Generate QR codes, create shareable landing pages, and integrate with popular portfolio platforms.",
      badge: "Pro"
    },
    {
      icon: Star,
      title: "Premium Templates",
      description: "Access exclusive profile templates designed by industry professionals for different voice-over niches.",
      badge: "Pro"
    },
    {
      icon: Headphones,
      title: "Audio Enhancement",
      description: "AI-powered audio enhancement, background noise removal, and voice optimization tools.",
      badge: "Pro"
    }
  ];

  const technicalFeatures = [
    {
      icon: Globe,
      title: "Global CDN",
      description: "Lightning-fast loading times worldwide with our global content delivery network."
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized", 
      description: "Fully responsive profiles that look perfect on all devices and screen sizes."
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Download your profiles as PDF portfolios or export audio files for external use."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader onGetStarted={onGetStarted} />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-brand-gradient bg-clip-text text-transparent">
            Powerful Features for Voice Professionals
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create stunning voice-over profiles that showcase your talent and tell your story.
          </p>
        </div>

        {/* Core Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Core Features</h2>
            <p className="text-lg text-muted-foreground">Essential tools available in all plans</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="interactive-card p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline">{feature.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Advanced Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Advanced Features</h2>
            <p className="text-lg text-muted-foreground">Premium tools for professional growth</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <Card key={index} className="interactive-card p-6 border-primary/20">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-brand-gradient rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <Badge className="bg-brand-gradient">{feature.badge}</Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technical Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Technical Excellence</h2>
            <p className="text-lg text-muted-foreground">Built with performance and reliability in mind</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {technicalFeatures.map((feature, index) => (
              <Card key={index} className="interactive-card p-6 text-center">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-accent/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="mb-20">
          <Card className="elevated-card overflow-hidden">
            <CardHeader className="bg-muted/50 p-8">
              <CardTitle className="text-2xl text-center">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 pr-8">Feature</th>
                      <th className="text-center py-4 px-4">Free</th>
                      <th className="text-center py-4 px-4">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-4 pr-8">Voice-Over Profiles</td>
                      <td className="text-center py-4 px-4">1</td>
                      <td className="text-center py-4 px-4">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-8">Video Upload Duration</td>
                      <td className="text-center py-4 px-4">2 minutes</td>
                      <td className="text-center py-4 px-4">10 minutes</td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-8">Custom Branding</td>
                      <td className="text-center py-4 px-4">-</td>
                      <td className="text-center py-4 px-4">✓</td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-8">Analytics Dashboard</td>
                      <td className="text-center py-4 px-4">Basic</td>
                      <td className="text-center py-4 px-4">Advanced</td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-8">Audio Enhancement</td>
                      <td className="text-center py-4 px-4">-</td>
                      <td className="text-center py-4 px-4">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="elevated-card p-12 bg-brand-gradient">
            <CardContent className="p-0">
              <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Ready to Experience These Features?</h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Start creating your professional voice-over profile today and discover how our features can transform your career.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" onClick={onGetStarted}>
                  Start Free Trial
                </Button>
                <Button variant="outline" size="lg" className="border-white/20 text-primary-foreground hover:bg-white/10">
                  View Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
};

export default Features;