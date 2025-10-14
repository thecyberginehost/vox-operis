import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Heart, Users, Target, Lightbulb } from "lucide-react";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-brand-gradient bg-clip-text text-transparent">
            About Vox-Operis
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Born from a LinkedIn connection, built with passion for empowering voice professionals worldwide.
          </p>
        </div>

        {/* Origin Story */}
        <section className="mb-20">
          <Card className="elevated-card p-8 md:p-12">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Linkedin className="h-8 w-8 text-primary" />
                    <Badge className="text-sm">Our Origin Story</Badge>
                  </div>
                  <h2 className="text-3xl font-bold mb-6">A Connection That Changed Everything</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      It started with a simple LinkedIn message. Three professionals from diverse technical backgrounds—
                      recruitment, UX/UI engineering, and cybersecurity & AI automation—connected over a shared observation: 
                      the voice industry lacked effective digital showcasing solutions.
                    </p>
                    <p>
                      Despite having no direct experience in voice-over work, our technical expertise allowed us to see 
                      the industry with fresh eyes. We recognized that traditional portfolio methods were inadequate for 
                      the digital age, and voice professionals deserved better tools to present their craft.
                    </p>
                    <p>
                      Our diverse skill set—talent acquisition insights, user experience design, and cutting-edge AI 
                      technology—proved to be the perfect combination for solving this industry challenge. What began as 
                      a technical discussion evolved into a mission to revolutionize how voice professionals showcase their talent.
                    </p>
                    <p>
                      This unique perspective from outside the voice industry became our strength, enabling us to build 
                      innovative solutions unconstrained by traditional approaches.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-brand-gradient rounded-lg p-8 text-center">
                    <Users className="h-16 w-16 text-primary-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-primary-foreground mb-2">Three Minds, One Vision</h3>
                    <p className="text-primary-foreground/80">Diverse expertise united by innovation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mission & Vision */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          <Card className="interactive-card p-8">
            <CardHeader className="p-0 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                To democratize voice-over portfolio creation by leveraging cutting-edge technology and user-centered design. 
                We combine our technical expertise in recruitment, UX/UI engineering, and AI automation to build intuitive 
                platforms that empower voice professionals to showcase their complete professional narrative—not just their voice, 
                but their journey, personality, and unique value proposition.
              </p>
            </CardContent>
          </Card>

          <Card className="interactive-card p-8">
            <CardHeader className="p-0 mb-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-2xl">Our Vision</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-muted-foreground">
                A future where technology seamlessly bridges the gap between voice talent and opportunity. By applying 
                innovative solutions from recruitment, user experience design, and AI automation, we envision a world where 
                voice professionals can create compelling, multi-dimensional profiles that transcend traditional demo reels, 
                enabling authentic connections and celebrating the human stories behind every voice.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="interactive-card p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-brand-gradient rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Technical Innovation</h3>
                <p className="text-muted-foreground">
                  Our technical backgrounds enable us to build innovative solutions that push boundaries. We leverage AI, 
                  modern UX principles, and industry insights to create tools that truly serve our users.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-brand-gradient rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">User-Centric Design</h3>
                <p className="text-muted-foreground">
                  With expertise in UX/UI engineering and recruitment, we understand both user needs and industry requirements. 
                  Every feature is designed with the end user experience in mind.
                </p>
              </CardContent>
            </Card>

            <Card className="interactive-card p-6 text-center">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-brand-gradient rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Lightbulb className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Industry Expertise</h3>
                <p className="text-muted-foreground">
                  Our recruitment background provides deep insights into talent presentation and career development, 
                  while our cybersecurity expertise ensures platform security and user data protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* The Journey Continues */}
        <section>
          <Card className="elevated-card p-8 md:p-12 bg-brand-gradient text-center">
            <CardContent className="p-0">
              <h2 className="text-3xl font-bold mb-4 text-primary-foreground">Our Technical Foundation</h2>
              <p className="text-xl text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
                What started as a LinkedIn conversation between three technical professionals has evolved into a comprehensive 
                platform serving thousands of voice professionals worldwide.
              </p>
              <p className="text-primary-foreground/80 max-w-3xl mx-auto">
                Our unique combination of recruitment insights, UX/UI engineering excellence, and AI automation expertise 
                continues to drive innovation in the voice industry. We may not have started in voice-over, but our technical 
                perspective has enabled us to build solutions that the industry didn't know it needed. Every profile created 
                and every connection made validates our belief that technology can transform how talent is discovered and showcased.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section className="mt-20">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Voice Professionals</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Profiles Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50,000+</div>
              <div className="text-muted-foreground">Profile Views</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-muted-foreground">User Satisfaction</div>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
};

export default About;