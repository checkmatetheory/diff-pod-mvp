import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Lock, 
  TrendingUp, 
  Users, 
  ArrowRight
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';

// Import images directly - they'll be bundled and immediately available
import carousel1 from '@/assets/carousel-1.png';
import carousel2 from '@/assets/carousel-2.png';
import carousel3 from '@/assets/carousel-3.png';
import carousel4 from '@/assets/carousel-4.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Images are now imported as modules - instantly available
  const carouselImages = [
    carousel1,
    carousel2,
    carousel3,
    carousel4
  ];

  // Auto-scroll every 9 seconds
  useEffect(() => {
    if (!api) return;

    const autoplay = setInterval(() => {
      api.scrollNext();
    }, 9000);

    return () => {
      clearInterval(autoplay);
    };
  }, [api]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast({
          title: 'Authentication Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop Carousel - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block lg:w-[60%] bg-gradient-to-br from-blue-50 to-sky-100 relative h-screen">
        <Carousel 
          className="w-full h-screen"
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="h-screen ml-0">
            {carouselImages.map((image, index) => (
              <CarouselItem key={index} className="h-screen pl-0">
                <div className="h-screen w-full relative bg-gradient-to-br from-blue-50 to-sky-100">
                  <img 
                    src={image} 
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <CarouselPrevious className="left-6 bg-white/20 border-white/30 text-white hover:bg-white/30" />
          <CarouselNext className="right-6 bg-white/20 border-white/30 text-white hover:bg-white/30" />
          
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
            {carouselImages.map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-white/50"></div>
            ))}
          </div>
        </Carousel>
      </div>

      {/* Auth Form - Full width on mobile, 40% on desktop */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="text-center pb-6 lg:pb-8">
              {/* Diffused Logo - Mobile Only */}
              <div className="flex justify-center mb-1 lg:hidden">
                <img 
                  src="/diffused logo deep blue no bg (1).png" 
                  alt="Diffused" 
                  className="h-12 w-auto"
                />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
                {isLogin ? 'Welcome Back' : 'Join Diffused'}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-2 text-gray-600">
                {isLogin 
                  ? 'Transform your conferences into revenue engines'
                  : 'Start turning events into year-round lead generation'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-medium border-gray-200 hover:bg-gray-50 transition-all duration-200 mb-4"
                onClick={handleGoogleSignIn}
                disabled={loading}
                size="lg"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              {/* OR Divider */}
              <div className="flex items-center my-4 sm:my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 sm:px-4 text-xs sm:text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="email" className="text-sm sm:text-base font-medium text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 sm:pl-12 py-2.5 sm:py-3 text-sm sm:text-base border-gray-200 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="password" className="text-sm sm:text-base font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 sm:pl-12 py-2.5 sm:py-3 text-sm sm:text-base border-gray-200 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 sm:py-3 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2" />
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Get Started'}
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 sm:mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm sm:text-base text-gray-600 hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>

              {/* Trust indicators - Hidden on mobile since they're in the header */}
              <div className="hidden lg:block mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center mb-3">Trusted by leading conferences</p>
                <div className="flex justify-center items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>$1M+ Revenue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>500+ Events</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
