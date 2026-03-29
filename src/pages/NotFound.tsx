import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, LogIn } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== "/universe") {
      console.debug("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-24 pb-16">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        <p className="text-xs text-muted-foreground font-mono break-all opacity-80">{location.pathname}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate("/docs")}>
            <BookOpen className="h-4 w-4" />
            How it works
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate("/login")}>
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
