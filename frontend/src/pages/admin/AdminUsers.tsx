import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui';
import { ButtonGhost, Input, Label, ButtonPrimary } from '@/components/ui';
import { ChevronLeft, ChevronRight, Search, User, Download, Plus, ChevronDown, Mail, MapPin, Calendar, Shield, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui';
import { toast } from 'sonner';

export function AdminUsersPage() {
  const { users, fetchUsers, loading, createUser, updateUser } = useAdminStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '',
    country: '',
    role: 'USER',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers({ page, search: searchDebounced });
  }, [page, searchDebounced, fetchUsers]);

  if (!user || user.role !== 'ADMIN') return <div className="min-h-screen flex items-center justify-center text-gray-400">Acceso denegado</div>;

  const exportCSV = () => {
    const headers = ['ID', 'Email', 'Usuario', 'Nombre', 'Apellido', 'País', 'Rol', 'Registrado', 'Completados'];
    const rows = users.users.map((u: any) => [
      u.id, u.email, u.username, u.firstName || '', u.lastName || '', u.country || '', u.role,
      new Date(u.createdAt).toLocaleDateString(), u.completedCount
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.map((v: any) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createUser({
        email: form.email,
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        age: form.age ? parseInt(form.age) : undefined,
        country: form.country || undefined,
        role: form.role,
      });
      toast.success('Usuario creado correctamente');
      setShowCreateDialog(false);
      setForm({ email: '', username: '', password: '', firstName: '', lastName: '', age: '', country: '', role: 'USER' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (u: any) => {
    setEditingUser(u);
    setForm({
      email: u.email,
      username: u.username,
      password: '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      age: u.age ? String(u.age) : '',
      country: u.country || '',
      role: u.role,
    });
    setError('');
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        email: form.email,
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        age: form.age ? parseInt(form.age) : undefined,
        country: form.country || undefined,
        role: form.role,
      };
      if (form.password) payload.password = form.password;
      await updateUser(editingUser.id, payload);
      toast.success('Usuario actualizado correctamente');
      setShowEditDialog(false);
      setEditingUser(null);
      setForm({ email: '', username: '', password: '', firstName: '', lastName: '', age: '', country: '', role: 'USER' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCard = (userId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const roleBadge = (role: string) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
    }`}>
      {role}
    </span>
  );

  const userCard = (u: any) => {
    const isExpanded = expandedCards.has(u.id);
    return (
      <Card key={u.id} className="overflow-hidden transition-all">
        <div 
          onClick={() => toggleCard(u.id)}
          className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary-600">
              {u.firstName?.[0]}{u.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
            <p className="text-sm text-gray-500">@{u.username}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {roleBadge(u.role)}
            <button
              onClick={(e) => { e.stopPropagation(); openEditDialog(u); }}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Editar usuario"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3 animate-slide-down">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="w-4 h-4" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{u.country || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Shield className="w-4 h-4" />
                <span>{roleBadge(u.role)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Completados:</span>
              <span className="font-medium text-gray-900">{u.completedCount}</span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ButtonGhost onClick={() => navigate('/admin')}>
            <ChevronLeft className="w-4 h-4" />
          </ButtonGhost>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6" /> Gestión de Usuarios
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonGhost onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </ButtonGhost>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <ButtonPrimary>
                <Plus className="w-4 h-4 mr-2" /> Crear Usuario
              </ButtonPrimary>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>Completa los datos para crear un nuevo usuario en la plataforma.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" placeholder="Juan" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" placeholder="Pérez" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Usuario</Label>
                  <Input id="username" placeholder="juanperez" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="age">Edad</Label>
                    <Input id="age" type="number" placeholder="25" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" placeholder="México" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Rol</Label>
                  <select id="role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm">
                    <option value="USER">Usuario</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <DialogFooter className="flex gap-3">
                  <ButtonGhost onClick={() => { setShowCreateDialog(false); setForm({ email: '', username: '', password: '', firstName: '', lastName: '', age: '', country: '', role: 'USER' }); }}>
                    Cancelar
                  </ButtonGhost>
                  <ButtonPrimary type="submit" disabled={submitting}>
                    {submitting ? <span className="animate-spin">⏳</span> : 'Crear Usuario'}
                  </ButtonPrimary>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por email, usuario, nombre..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile: Collapsible Cards */}
      <div className="md:hidden space-y-3">
        {users.users.map(u => userCard(u))}
        {users.users.length === 0 && (
          <div className="p-12 text-center text-gray-500">No se encontraron usuarios</div>
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium text-primary-600">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                            <p className="text-sm text-gray-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{u.email}</td>
                      <td className="px-6 py-4 text-gray-700">{u.country || '-'}</td>
                      <td className="px-6 py-4">{roleBadge(u.role)}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{u.completedCount}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openEditDialog(u)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Editar usuario"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.users.length === 0 && (
              <div className="p-12 text-center text-gray-500">No se encontraron usuarios</div>
            )}
          </CardContent>
        </Card>
      </div>

      {users.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <ButtonGhost onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </ButtonGhost>
          <span className="text-gray-600">
            Página {page} de {users.totalPages} ({users.total} total)
          </span>
          <ButtonGhost onClick={() => setPage(p => Math.min(users.totalPages, p + 1))} disabled={page >= users.totalPages}>
            <ChevronRight className="w-4 h-4" />
          </ButtonGhost>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos de {editingUser?.firstName} {editingUser?.lastName}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-firstName">Nombre</Label>
                <Input id="edit-firstName" placeholder="Juan" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lastName">Apellido</Label>
                <Input id="edit-lastName" placeholder="Pérez" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-username">Usuario</Label>
              <Input id="edit-username" placeholder="juanperez" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">Contraseña (dejar vacío para no cambiar)</Label>
              <Input id="edit-password" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-age">Edad</Label>
                <Input id="edit-age" type="number" placeholder="25" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-country">País</Label>
                <Input id="edit-country" placeholder="México" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Rol</Label>
              <select id="edit-role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm">
                <option value="USER">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <DialogFooter className="flex gap-3">
              <ButtonGhost onClick={() => { setShowEditDialog(false); setEditingUser(null); }}>
                Cancelar
              </ButtonGhost>
              <ButtonPrimary type="submit" disabled={submitting}>
                {submitting ? <span className="animate-spin">⏳</span> : 'Guardar Cambios'}
              </ButtonPrimary>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}