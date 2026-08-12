import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { programApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { User, Mail, AtSign, Calendar, Lock, Eye, EyeOff, Save, Trophy, Flame, Target, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, updateProfile, updateAvatar } = useAuthStore();
  const [gamification, setGamification] = useState({ points: 0, level: 1, streak: 0 });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    age: user?.age || '',
    country: user?.country || '',
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    programApi.progress().then(res => {
      setGamification({
        points: res.data.points || 0,
        level: res.data.level || 1,
        streak: res.data.streak || 0,
      });
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }
    setAvatarLoading(true);
    try {
      await updateAvatar(file);
      toast.success('Foto de perfil actualizada');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al subir la foto');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="pl-4 border-l-4 border-primary-600">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal</p>
      </div>

      {/* User Card + Gamification */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-700 font-bold text-xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-md">
              {avatarLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-500">@{user?.username}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <Trophy className="w-4 h-4" />
              <span className="font-bold text-lg">{gamification.level}</span>
            </div>
            <p className="text-xs text-gray-500">Nivel</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary-500">
              <Target className="w-4 h-4" />
              <span className="font-bold text-lg">{gamification.points}</span>
            </div>
            <p className="text-xs text-gray-500">Puntos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="font-bold text-lg">{gamification.streak}</span>
            </div>
            <p className="text-xs text-gray-500">Racha</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <h3 className="font-semibold text-gray-900">Información Personal</h3>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Apellido</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nombre de usuario</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Edad</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    inputMode="numeric"
                    enterKeyHint="next"
                    min={13}
                    max={120}
                    step={1}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>País</Label>
                <CountrySelect
                  value={form.country}
                  onChange={(v) => setForm({ ...form, country: v })}
                />
              </div>
            </div>

            {success && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                {success}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-md shadow-primary-600/20">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <h3 className="font-semibold text-gray-900">Cambiar Contraseña</h3>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-4">
            <div className="space-y-1.5">
              <Label>Contraseña actual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="pl-10 pr-10"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" variant="default" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
              <Lock className="w-4 h-4" />
              Actualizar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}