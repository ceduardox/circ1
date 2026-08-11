import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { ButtonPrimary, ButtonGhost, ButtonDanger, Input, Label, Textarea } from '@/components/ui';
import { Plus, Trash2, Edit, ChevronLeft, Loader2, BookOpen, Save } from 'lucide-react';
import { toast } from 'sonner';

const daySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type DayFormData = z.infer<typeof daySchema>;

const contentSchema = z.object({
  type: z.enum(['REFLECTION', 'AFFIRMATION', 'VIDEO', 'QUIZ', 'MENTAL_EXERCISE', 'CONFIDENCE_TASK']),
  title: z.string().min(1).max(255),
  content: z.any(),
  orderIndex: z.number().int().default(0),
  isRequired: z.boolean().default(true),
});

type ContentFormData = z.infer<typeof contentSchema>;

const contentTypeLabels: Record<string, string> = {
  REFLECTION: '🎯 Reflexión',
  AFFIRMATION: '💪 Afirmación',
  VIDEO: '📹 Video',
  QUIZ: '🧠 Quiz',
  MENTAL_EXERCISE: '🧘 Ejercicio Mental',
  CONFIDENCE_TASK: '💼 Reto Confianza',
};

const contentTypeDefaults: Record<string, any> = {
  REFLECTION: { prompt: '', placeholder: '', minChars: 10 },
  AFFIRMATION: { text: '', repeatCount: 3, instruction: '' },
  VIDEO: { url: '', provider: 'facebook', duration: 0, description: '' },
  QUIZ: { questions: [], passingScore: 70 },
  MENTAL_EXERCISE: { instruction: '', durationMinutes: 5, steps: [] },
  CONFIDENCE_TASK: { task: '', evidenceType: 'text', description: '' },
};

export function AdminDaysPage() {
  const { days, fetchDays, createDay, updateDay, deleteDay, loading } = useAdminStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDays(); }, [fetchDays]);

  const { register: dayRegister, handleSubmit: dayHandleSubmit, reset: dayReset, formState: { errors: dayErrors } } = useForm<DayFormData>({
    resolver: zodResolver(daySchema),
  });

  const onCreateDay = async (data: DayFormData) => {
    setSubmitting(true);
    try {
      await createDay(data);
      toast.success('Día creado');
      setShowCreate(false);
      dayReset();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error');
    } finally { setSubmitting(false); }
  };

  const onUpdateDay = async (data: DayFormData) => {
    setSubmitting(true);
    try {
      await updateDay(editingDay.id, data);
      toast.success('Día actualizado');
      setEditingDay(null);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este día y todos sus contenidos?')) return;
    try {
      await deleteDay(id);
      toast.success('Eliminado');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error');
    }
  };

  if (!user || user.role !== 'ADMIN') return <div className="min-h-screen flex items-center justify-center text-gray-400">Acceso denegado</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ButtonGhost onClick={() => navigate('/admin')}>
            <ChevronLeft className="w-4 h-4" />
          </ButtonGhost>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Días del Programa
          </h1>
        </div>
        <ButtonPrimary onClick={() => { dayReset(); setShowCreate(true); }} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Día
        </ButtonPrimary>
      </div>

        {showCreate && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-100">Crear Nuevo Día</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={dayHandleSubmit(onCreateDay)} className="space-y-4">
                <div>
                  <Label htmlFor="dayNumber">Número de Día</Label>
                  <Input id="dayNumber" type="number" {...dayRegister('dayNumber')} />
                  {dayErrors.dayNumber && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{dayErrors.dayNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" {...dayRegister('title')} />
                  {dayErrors.title && <p className="text-red-500 text-sm mt-1">{dayErrors.title.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" {...dayRegister('description')} rows={3} />
                </div>
                <div className="flex gap-3">
                  <ButtonPrimary type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />} Crear
                  </ButtonPrimary>
                  <ButtonGhost onClick={() => setShowCreate(false)}>Cancelar</ButtonGhost>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingDay && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-100">Editar Día {editingDay.dayNumber}</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={dayHandleSubmit(onUpdateDay)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" {...dayRegister('title')} />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" {...dayRegister('description')} rows={3} />
                </div>
                <div className="flex items-center gap-2">
                  <Input type="checkbox" id="isActive" {...dayRegister('isActive')} className="w-4 h-4" />
                  <Label htmlFor="isActive" className="mb-0">Activo</Label>
                </div>
                <div className="flex gap-3">
                  <ButtonPrimary type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />} Guardar
                  </ButtonPrimary>
                  <ButtonGhost onClick={() => setEditingDay(null)}>Cancelar</ButtonGhost>
                  <ButtonDanger onClick={() => handleDelete(editingDay.id)}><Trash2 className="w-4 h-4 mr-2" /> Eliminar</ButtonDanger>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {days.map(day => (
            <Card key={day.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 shrink-0">
                      {day.dayNumber}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-dark-100 truncate">{day.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-dark-400">{day.contents?.length || 0} contenidos · {day.isActive ? 'Activo' : 'Inactivo'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to={`/admin/days/${day.id}`}>
                      <ButtonGhost size="sm"><Edit className="w-4 h-4" /></ButtonGhost>
                    </Link>
                    <ButtonGhost size="sm" variant="danger" onClick={() => handleDelete(day.id)}>
                      <Trash2 className="w-4 h-4" />
                    </ButtonGhost>
                  </div>
                </div>
                {day.description && <p className="text-gray-600 dark:text-dark-400 text-sm mt-2 ml-13 hidden sm:block">{day.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {days.length === 0 && !showCreate && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 dark:text-dark-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-dark-100 mb-2">No hay días creados</h3>
              <p className="text-gray-500 dark:text-dark-400 mb-4">Crea el primer día del programa</p>
              <ButtonPrimary onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" /> Crear Primer Día</ButtonPrimary>
            </CardContent>
          </Card>
        )}
    </div>
  );
}