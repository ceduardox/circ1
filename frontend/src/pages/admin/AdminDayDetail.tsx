import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { ButtonPrimary, ButtonGhost, Input, Label, Textarea, Select } from '@/components/ui';
import { Plus, Trash2, Edit, ChevronLeft, ChevronUp, ChevronDown, Loader2, GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const contentTypeLabels: Record<string, string> = {
  REFLECTION: '🎯 Reflexión',
  AFFIRMATION: '💪 Afirmación',
  VIDEO: '📹 Video',
  QUIZ: '🧠 Quiz',
  MENTAL_EXERCISE: '🧘 Ejercicio Mental',
  CONFIDENCE_TASK: '💼 Reto Confianza',
};

const contentTypeDefaults: Record<string, string> = {
  REFLECTION: JSON.stringify({ prompt: '', placeholder: '', minChars: 10 }, null, 2),
  AFFIRMATION: JSON.stringify({ text: '', repeatCount: 3, instruction: '' }, null, 2),
  VIDEO: JSON.stringify({ url: '', provider: 'facebook', duration: 0, description: '' }, null, 2),
  QUIZ: JSON.stringify({ questions: [], passingScore: 70 }, null, 2),
  MENTAL_EXERCISE: JSON.stringify({ instruction: '', durationMinutes: 5, steps: [] }, null, 2),
  CONFIDENCE_TASK: JSON.stringify({ task: '', evidenceType: 'text', description: '' }, null, 2),
};

interface ContentItem {
  id: string;
  type: string;
  title: string;
  content: any;
  orderIndex: number;
  isRequired: boolean;
}

function SortableContentItem({ content, index, onEdit, onDelete }: { content: ContentItem; index: number; onEdit: (c: ContentItem) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: content.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200"
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0" aria-label="Arrastrar">
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate block">{content.title}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 text-xs rounded bg-primary-100 text-primary-600 whitespace-nowrap">
              {contentTypeLabels[content.type as string] || content.type}
            </span>
            {content.isRequired && <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-600 whitespace-nowrap">Requerido</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ButtonGhost size="sm" onClick={() => onEdit(content)}><Edit className="w-4 h-4" /></ButtonGhost>
          <ButtonGhost size="sm" onClick={() => onDelete(content.id)}><Trash2 className="w-4 h-4 text-red-500" /></ButtonGhost>
        </div>
      </div>
    </div>
  );
}

export function AdminDayDetailPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const { days, fetchDays, createContent, updateContent, deleteContent, reorderContents } = useAdminStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('REFLECTION');
  const [jsonContent, setJsonContent] = useState(contentTypeDefaults.REFLECTION);

  useEffect(() => {
    if (dayId) fetchDays();
  }, [dayId, fetchDays]);

  const currentDay = days.find(d => d.id === dayId);

  const resetForm = () => {
    setEditingContent(null);
    setSelectedType('REFLECTION');
    setJsonContent(contentTypeDefaults.REFLECTION);
    setValue('title', '');
    setValue('orderIndex', 0);
    setValue('isRequired', true);
    setShowCreate(true);
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { title: '', orderIndex: 0, isRequired: true },
  });

  const onSubmit = async (data: { title: string; orderIndex: number; isRequired: boolean }) => {
    setSubmitting(true);
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonContent);
      } catch {
        toast.error('El contenido no es JSON válido');
        setSubmitting(false);
        return;
      }

      const payload = {
        type: selectedType,
        title: data.title,
        content: parsed,
        orderIndex: data.orderIndex,
        isRequired: data.isRequired,
      };

      if (editingContent) {
        await updateContent(editingContent.id, payload);
        toast.success('Contenido actualizado');
      } else {
        await createContent({ ...payload, dayId: dayId! });
        toast.success('Contenido creado');
      }
      setShowCreate(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este contenido?')) return;
    try {
      await deleteContent(id);
      toast.success('Eliminado');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error');
    }
  };

  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setSelectedType(content.type);
    setJsonContent(JSON.stringify(content.content, null, 2));
    setValue('title', content.title);
    setValue('orderIndex', content.orderIndex);
    setValue('isRequired', content.isRequired);
    setShowCreate(true);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setJsonContent(contentTypeDefaults[type] || contentTypeDefaults.REFLECTION);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const contents: ContentItem[] = (currentDay?.contents || []).sort((a, b) => a.orderIndex - b.orderIndex);

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = contents.findIndex(c => c.id === active.id);
    const newIndex = contents.findIndex(c => c.id === over.id);
    const newOrder = arrayMove(contents, oldIndex, newIndex);
    await reorderContents(dayId!, newOrder.map(c => c.id));
  };

  if (!user || user.role !== 'ADMIN') return <div className="min-h-screen flex items-center justify-center text-gray-400">Acceso denegado</div>;
  if (!currentDay) return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ButtonGhost onClick={() => navigate('/admin/days')}>
            <ChevronLeft className="w-4 h-4" />
          </ButtonGhost>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Día {currentDay.dayNumber}: {currentDay.title}</h1>
            <p className="text-gray-500">{contents.length} contenidos</p>
          </div>
        </div>
        <ButtonPrimary onClick={resetForm} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Agregar Contenido
        </ButtonPrimary>
      </div>

        {showCreate && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{editingContent ? 'Editar' : 'Nuevo'} Contenido</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Tipo de Contenido</Label>
                  <Select value={selectedType} onChange={(e) => handleTypeChange(e.target.value)} className="w-full">
                    {Object.entries(contentTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" {...register('title')} />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label>Contenido (JSON)</Label>
                  <Textarea
                    id="content"
                    rows={8}
                    className="font-mono text-xs"
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                    placeholder={contentTypeDefaults.REFLECTION}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato JSON específico del tipo de contenido. Cambia arriba el tipo para ver el formato base.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orderIndex">Orden</Label>
                    <Input id="orderIndex" type="number" {...register('orderIndex', { valueAsNumber: true })} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Input type="checkbox" id="isRequired" {...register('isRequired')} className="w-4 h-4" />
                    <Label htmlFor="isRequired" className="mb-0">Requerido para avanzar</Label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ButtonPrimary type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />} {editingContent ? 'Actualizar' : 'Crear'}
                  </ButtonPrimary>
                  <ButtonGhost onClick={() => setShowCreate(false)}>Cancelar</ButtonGhost>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Contenidos (arrastra para reordenar)</h2>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={contents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {contents.map((content, index) => (
                    <SortableContentItem
                      key={content.id}
                      content={content}
                      index={index}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {contents.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Plus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay contenidos. Agrega el primero.</p>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}