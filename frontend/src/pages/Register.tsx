import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ButtonPrimary, Input, Label, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Mail, Lock, User, AlertCircle, Eye, EyeOff, UserPlus, FileText, CheckCircle2 } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const { register: registerUser, isLoading: authLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const referralCode = useMemo(() => {
    const ref = searchParams.get('ref');
    return ref ? ref.trim() : null;
  }, [searchParams]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { age: undefined, country: '' },
  });

  const password = watch('password');
  const [countryValue, setCountryValue] = useState('');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        country: countryValue,
        referralCode: referralCode || undefined,
      });
      toast.success('¡Cuenta creada! Elige tu plan y empieza a ganar por referidos');
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al registrar');
      toast.error('Error al crear cuenta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-900 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100">Crear Cuenta</h1>
            <div className="mt-2 h-1 w-12 mx-auto rounded-full bg-gradient-to-r from-primary-600 to-purple-500" />
            <p className="text-gray-500 dark:text-dark-400 mt-2">Únete a la comunidad de neuroentrenamiento</p>
            {referralCode && (
              <p className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-full text-sm text-primary-700 dark:text-primary-400 font-medium">
                <UserPlus className="w-4 h-4" />
                Invitado por {referralCode}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" placeholder="Juan" {...register('firstName')} />
                {errors.firstName && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" placeholder="Pérez" {...register('lastName')} />
                {errors.lastName && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" placeholder="tu@email.com" className="pl-10" {...register('email')} />
              </div>
              {errors.email && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="username" placeholder="juanperez" className="pl-10" {...register('username')} />
              </div>
              {errors.username && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.username.message}</p>}
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
              {errors.password && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10" {...register('confirmPassword')} />
              </div>
              {errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  enterKeyHint="next"
                  min={13}
                  max={120}
                  step={1}
                  placeholder="25"
                  {...register('age', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <CountrySelect
                  id="country"
                  value={countryValue}
                  onChange={v => setCountryValue(v)}
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-1 accent-primary-600 w-4 h-4 flex-shrink-0"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-dark-300">
                Acepto los{' '}
                <button type="button" onClick={() => setTermsOpen(true)} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  Términos y Condiciones
                </button>{' '}
                y la{' '}
                <button type="button" onClick={() => setTermsOpen(true)} className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  Política de Privacidad
                </button>
              </label>
            </div>

            <ButtonPrimary type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cuenta'}
            </ButtonPrimary>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-dark-400 mt-6">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[85dvh] flex flex-col gap-0 overflow-hidden dark:bg-dark-800 dark:border-dark-600">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-dark-700">
            <DialogTitle className="flex items-center gap-2 dark:text-dark-100">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Términos y Condiciones
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-gray-600 dark:text-dark-300 space-y-4 leading-relaxed">
            <p>
              Al crear tu cuenta en <strong>Círculo 1</strong> aceptas participar en un programa de
              neuroentrenamiento y desarrollo de habilidades de venta. El acceso al contenido se otorga
              tras el pago de la membresía correspondiente.
            </p>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-dark-100 mb-1">Comisiones y retiros</h4>
              <p>
                Las comisiones por referidos se acreditan solo si tu membresía está al día. Los retiros
                de fondos se procesan manualmente y pueden incluir un fee por la pasarela de pago
                (entre 4% y 6%), el cual se descuenta del monto solicitado.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-dark-100 mb-1">Responsabilidad</h4>
              <p>
                Eres responsable de la veracidad de tus datos y de tus cuentas de pago (wallets o cuentas
                bancarias). No nos hacemos responsables por fondos enviados a una dirección incorrecta
                proporcionada por ti.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-dark-100 mb-1">Privacidad</h4>
              <p>
                Tus datos personales se usan únicamente para gestionar tu cuenta, pagos y red de referidos.
                No se comparten con terceros sin tu consentimiento, salvo requerimiento legal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-dark-100 mb-1">Políticas</h4>
              <p>
                Círculo 1 se reserva el derecho de suspender cuentas que incumplan estas condiciones o que
                usen prácticas fraudulentas en la red de referidos.
              </p>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="text-sm text-gray-500 dark:text-dark-300 hover:text-gray-700 dark:hover:text-dark-100 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              Cerrar
            </button>
            <ButtonPrimary
              type="button"
              onClick={() => { setAcceptedTerms(true); setTermsOpen(false); }}
              className="px-4"
            >
              <CheckCircle2 className="w-4 h-4" /> Aceptar
            </ButtonPrimary>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
