import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ArrowRight } from "lucide-react";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";

const Blog = () => {
  const blogPosts = [
    {
      title: "The Future of Voice-Over: How AI is Changing the Industry",
      excerpt: "Explore how artificial intelligence is reshaping the voice-over landscape and what it means for voice professionals.",
      author: "Vox-Operis Team",
      date: "2024-01-15",
      readTime: "5 min read",
      category: "Industry Insights",
      featured: true
    },
    {
      title: "Building Your Voice Brand: Essential Tips for Success",
      excerpt: "Learn how to create a distinctive voice brand that sets you apart in the competitive voice-over market.",
      author: "Sarah Chen",
      date: "2024-01-10",
      readTime: "7 min read",
      category: "Career Tips"
    },
    {
      title: "The Power of Storytelling in Voice-Over Work",
      excerpt: "Discover how compelling storytelling can elevate your voice-over performances and connect with audiences.",
      author: "Marcus Rodriguez",
      date: "2024-01-05",
      readTime: "6 min read",
      category: "Techniques"
    },
    {
      title: "From Beginner to Pro: A Voice-Over Journey",
      excerpt: "Follow one professional's journey from voice-over novice to industry expert, including lessons learned along the way.",
      author: "Elena Thompson",
      date: "2023-12-28",
      readTime: "8 min read",
      category: "Success Stories"
    },
    {
      title: "Voice-Over Equipment on a Budget: Getting Started",
      excerpt: "A comprehensive guide to building your home studio without breaking the bank, featuring recommended gear and setup tips.",
      author: "Technical Team",
      date: "2023-12-20",
      readTime: "10 min read",
      category: "Equipment"
    },
    {
      title: "The Psychology Behind Effective Voice-Over",
      excerpt: "Understanding the psychological principles that make voice-over work more engaging and persuasive.",
      author: "Dr. Voice Expert",
      date: "2023-12-15",
      readTime: "9 min read",
      category: "Psychology"
    }
  ];

  const categories = ["All", "Industry Insights", "Career Tips", "Techniques", "Success Stories", "Equipment", "Psychology"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-brand-gradient bg-clip-text text-transparent">
            Voice-Over Insights & Stories
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert insights, industry trends, and inspiring stories from the world of voice-over professionals.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Badge 
              key={category} 
              variant={category === "All" ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Featured Post */}
        {blogPosts.filter(post => post.featured).map((post, index) => (
          <Card key={index} className="elevated-card mb-12 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="bg-brand-gradient aspect-video md:aspect-auto"></div>
              <CardContent className="p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-4">{post.category}</Badge>
                <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
                <p className="text-muted-foreground mb-6">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium cursor-pointer hover:gap-3 transition-all">
                  Read Full Article
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </div>
          </Card>
        ))}

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.filter(post => !post.featured).map((post, index) => (
            <Card key={index} className="interactive-card overflow-hidden">
              <div className="bg-muted aspect-video"></div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium cursor-pointer hover:gap-3 transition-all">
                  Read More
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <Card className="elevated-card p-8 mt-16 text-center bg-brand-gradient">
          <CardContent className="p-0">
            <h3 className="text-2xl font-bold mb-4 text-primary-foreground">Stay Updated</h3>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Get the latest voice-over insights, industry news, and expert tips delivered to your inbox.
            </p>
            <div className="flex max-w-md mx-auto gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-4 py-2 rounded-md bg-white/10 border border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <button className="px-6 py-2 bg-white text-primary font-medium rounded-md hover:bg-white/90 transition-colors">
                Subscribe
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      <GlobalFooter />
    </div>
  );
};

export default Blog;