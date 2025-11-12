import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-3 md:px-4">
      <div className="text-center space-y-3 md:space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">404</h1>
        <p className="text-base md:text-xl text-muted-foreground">页面未找到</p>
        <a 
          href="/" 
          className="inline-block text-sm md:text-base text-primary underline hover:text-primary/80 transition-colors"
        >
          返回主页
        </a>
      </div>
    </div>
  );
};

export default NotFound;
