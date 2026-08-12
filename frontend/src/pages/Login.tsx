import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

const SAVED_IDENTIFIER_KEY = 'circulo1_saved_identifier';

function loadSavedIdentifier(): string {
  try {
    return localStorage.getItem(SAVED_IDENTIFIER_KEY) || '';
  } catch {
    return '';
  }
}

export function LoginPage() {
  const [identifier, setIdentifier] = useState(loadSavedIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(loadSavedIdentifier() !== '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [registerOpen, setRegisterOpen] = useState<boolean | null>(null);

  useEffect(() => {
    authApi.registerStatus().then(({ data }) => setRegisterOpen(data.registerOpen)).catch(() => setRegisterOpen(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
      try {
        if (remember) localStorage.setItem(SAVED_IDENTIFIER_KEY, identifier.trim());
        else localStorage.removeItem(SAVED_IDENTIFIER_KEY);
      } catch { /* ignore */ }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-gray-50 to-purple-50 dark:from-dark-900 dark:via-dark-900 dark:to-dark-900 px-4 py-12 overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary-300/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center shadow-lg shadow-primary-600/30 animate-icon-float">
            <img src="/images/favicon.png" alt="Círculo 1" className="w-full h-full rounded-2xl object-cover" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center animate-badge-pop">
              <Sparkles className="w-3 h-3 text-emerald-950" />
            </div>
          </div>
          <div className="text-left">
            <p className="font-bold text-lg text-gray-900 dark:text-dark-100 leading-tight">Círculo 1</p>
            <p className="text-sm text-gray-500 dark:text-dark-400">Neuroentrenamiento</p>
          </div>
        </div>

        <Card className="shadow-2xl shadow-primary-900/10 border-0 relative animate-card-entrance">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-purple-500 to-primary-600 rounded-t-2xl" />
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Iniciar Sesión</h1>
              <div className="mt-2 h-1 w-12 mx-auto rounded-full bg-gradient-to-r from-primary-600 to-purple-500" />
              <p className="text-gray-500 dark:text-dark-400 mt-2">
                Accede a tu programa de entrenamiento
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="identifier">Email o usuario</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="tu@email.com o usuario"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700/50 text-sm text-gray-600 dark:text-dark-300 cursor-pointer select-none hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="accent-primary-600 w-4 h-4"
                  />
                  Guardar cuenta
                </label>
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full py-3 btn-auth-gradient text-white">
                Iniciar Sesión
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-dark-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tu cuenta está protegida con acceso seguro
            </div>
          </CardContent>
        </Card>

        {registerOpen !== false && (
          <p className="text-center mt-6 text-sm text-gray-500 dark:text-dark-400">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold">
              Regístrate aquí
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}