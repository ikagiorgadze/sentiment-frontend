import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center bg-primary">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-sm">
            Sign in to access your sentiment analysis dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthForm
            mode="login"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
