import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ButtonPrimary, Input, Label, Card, CardContent } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Mail, Lock, User, AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y _'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  age: z.number().min(13).max(120).optional(),
  country: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading: authLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { age: undefined, country: '' },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        country: data.country,
      });
      toast.success('¡Cuenta creada! Bienvenido a Círculo 1');
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al registrar');
      toast.error('Error al crear cuenta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
            <p className="text-gray-500 mt-2">Únete a la comunidad de neuroentrenamiento</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" placeholder="Juan" {...register('firstName')} />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" placeholder="Pérez" {...register('lastName')} />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" placeholder="tu@email.com" className="pl-10" {...register('email')} />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="username" placeholder="juanperez" className="pl-10" {...register('username')} />
              </div>
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10" {...register('confirmPassword')} />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Edad</Label>
                <Input id="age" type="number" placeholder="25" {...register('age', { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Input id="country" placeholder="México" {...register('country')} />
              </div>
            </div>

            <ButtonPrimary type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cuenta'}
            </ButtonPrimary>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary-600 hover:underline font-medium">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}