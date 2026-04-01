import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import logoImage from '../components/photos/LumenIQClear.png';
import { ArrowLeftIcon, Loader2 } from 'lucide-react';
import { useUnicornStudio } from '../utils/useUnicornStudio';
import { useAuth } from '../auth/hooks/useAuth';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useUnicornStudio();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            data-us-project="57WCL9Xqt44BBvTV9ehL"
            data-us-production="true"
            data-us-lazyload="true"
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-slate-950/55" aria-hidden="true" />
        </div>
      <div className="fixed top-4 left-4 w-fit h-fit z-10">
        <Button onClick={() => navigate('/')} className="text-white bg-transparent hover:bg-white/10">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </Button>
      </div>
      <div className="relative mx-auto flex min-h-screen items-center justify-center px-4 py-12 font-switzer sm:px-6">
        <Card className="w-full max-w-xl space-y-6 border-white/15 bg-transparent p-8 text-slate-900 shadow-xl backdrop-blur">
          {/* Logo */}
          <div className="flex justify-center items-center gap-2">
            <img src={logoImage} alt="LumenIQ" className="h-16 w-auto" />
            <p className="text-4xl font-outfit text-white">LumenIQ</p>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-outfit text-white">Sign in to your account</h1>
            <p className="text-sm text-white">Pick up where you left off and keep your social on autopilot.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-slate-200 bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-slate-200 bg-white/90"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-blue-primary text-white hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="text-center text-sm flex flex-col">
            <span className="text-white">Don't have an account?</span>
            <button
              onClick={() => navigate('/signup')}
              className="text-white hover:text-blue-300 hover:underline"
            >
              Sign up here
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
