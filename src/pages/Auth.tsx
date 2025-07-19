import { useState } from 'react';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Your uploaded carousel images
  const carouselImages = [
    '/carousel-1.png',
    '/carousel-2.png', 
    '/carousel-3.png',
    '/carousel-4.png'
  ];

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

  return (
    <div className="h-screen bg-background flex">
      {/* Left Side - Image Carousel (60% width) */}
      <div className="w-[60%] bg-gray-900 relative h-full">
        <Carousel 
          className="w-full h-screen"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="h-screen ml-0">
            {carouselImages.map((image, index) => (
              <CarouselItem key={index} className="h-screen pl-0">
                <div className="h-screen w-full relative">
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

      {/* Right Side - Auth Form (40% width) */}
      <div className="w-[40%] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-primary">
                {isLogin ? 'Welcome Back' : 'Join Diffused'}
              </CardTitle>
              <CardDescription className="text-base mt-2 text-gray-600">
                {isLogin 
                  ? 'Transform your conferences into revenue engines'
                  : 'Start turning events into year-round lead generation'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-medium text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 py-3 text-base border-gray-200 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-base font-medium text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 py-3 text-base border-gray-200 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Get Started'}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-base text-gray-600 hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
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