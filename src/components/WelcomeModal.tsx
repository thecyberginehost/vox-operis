import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Mic, Users, ArrowRight, X } from "lucide-react";

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal = ({ onClose }: WelcomeModalProps) => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in after mount
    setTimeout(() => setShow(true), 100);
  }, []);

  const handleCreateVO = () => {
    localStorage.removeItem('show_welcome_modal');
    onClose();
    navigate('/dashboard/create');
  };

  const handleExplore = () => {
    localStorage.removeItem('show_welcome_modal');
    onClose();
    navigate('/dashboard/talent');
  };

  const handleClose = () => {
    localStorage.removeItem('show_welcome_modal');
    setShow(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <Card
        className={`max-w-2xl w-full transform transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-3xl mb-2">Welcome to Vox-Operis!</CardTitle>
            <CardDescription className="text-lg">
              Your profile is set up. Now let's create something amazing!
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-4">Here's what you can do next:</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleCreateVO}>
              <CardContent className="p-4 text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Create Your VO</h3>
                <p className="text-xs text-muted-foreground">
                  Record your first voice-over profile
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleExplore}>
              <CardContent className="p-4 text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-1">Browse Profiles</h3>
                <p className="text-xs text-muted-foreground">
                  Explore other professionals
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Mic className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1">Share Your Profile</h3>
                <p className="text-xs text-muted-foreground">
                  Get discovered by recruiters
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm text-center">
              <strong>Pro Tip:</strong> Profiles with VO recordings get 5x more views!
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleClose}>
              I'll Explore Later
            </Button>
            <Button onClick={handleCreateVO} className="gap-2">
              Create My First VO
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeModal;
