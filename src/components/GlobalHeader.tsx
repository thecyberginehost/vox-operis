import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

interface GlobalHeaderProps {
  isAuthenticated?: boolean;
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

const GlobalHeader = ({ isAuthenticated = false, onGetStarted, onSignIn }: GlobalHeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <NavLink to="/" className="flex items-center space-x-3">
            <img src="/vox-operis-logo.png" alt="Vox-Operis" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Vox-Operis</span>
          </NavLink>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
            }
          >
            Home
          </NavLink>
          <NavLink 
            to="/features" 
            className={({ isActive }) => 
              `transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
            }
          >
            Features
          </NavLink>
          <NavLink 
            to="/blog" 
            className={({ isActive }) => 
              `transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
            }
          >
            Blog
          </NavLink>
          <NavLink 
            to="/about" 
            className={({ isActive }) => 
              `transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`
            }
          >
            About
          </NavLink>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </nav>
        
        <div className="flex items-center space-x-3">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={onSignIn}>Sign In</Button>
              <Button variant="hero" size="sm" onClick={onGetStarted}>Get Started</Button>
            </>
          ) : (
            <NavLink to="/dashboard">
              <Button variant="hero" size="sm">Dashboard</Button>
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;