import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, PageHeader } from '@/components/ui';
import { ButtonPrimary, ButtonGhost, ButtonDanger, Input, Label, Textarea, Select } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { Plus, Trash2, Edit, ChevronLeft, Loader2, GripVertical, Save, X, Eye, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentRenderer } from '@/components/program/ContentRenderer';

const contentTypeLabels: Record<string, string> = {
  REFLECTION: '🎯 Reflexión',
  AFFIRMATION: '💪 Afirmación',
  VIDEO: '📹 Video',
  QUIZ: '🧠 Quiz',
  MENTAL_EXERCISE: '🧘 Ejercicio Mental',
  CONFIDENCE_TASK: '💼 Reto Confianza',
  INTERACTIVE_EXERCISE: '🧩 Ejercicio Interactivo',
};

interface ContentItem {
  id: string;
  type: string;
  title: string;
  content: any;
  orderIndex: number;
  isRequired: boolean;
}

function SortableContentItem({ content, index, onEdit, onDelete, onPreview }: { content: ContentItem; index: number; onEdit: (c: ContentItem) => void; onDelete: (id: string) => void; onPreview: (c: ContentItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: content.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-200 transition-colors"
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
          <ButtonGhost size="sm" onClick={() => onPreview(content)}><Eye className="w-4 h-4" /></ButtonGhost>
          <ButtonGhost size="sm" onClick={() => onEdit(content)}><Edit className="w-4 h-4" /></ButtonGhost>
          <ButtonGhost size="sm" onClick={() => onDelete(content.id)}><Trash2 className="w-4 h-4 text-red-500" /></ButtonGhost>
        </div>
      </div>
    </div>
  );
}

function ReflectionForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Prompt (pregunta para el usuario)</Label>
        <Textarea rows={3} value={value.prompt || ''} onChange={e => onChange({ ...value, prompt: e.target.value })} placeholder="Ej: ¿Cuáles son tus sueños?" />
      </div>
      <div>
        <Label>Placeholder del textarea</Label>
        <Input value={value.placeholder || ''} onChange={e => onChange({ ...value, placeholder: e.target.value })} placeholder="Escribe aquí..." />
      </div>
      <div>
        <Label>Mínimo de caracteres</Label>
        <Input type="number" value={value.minChars || 10} onChange={e => onChange({ ...value, minChars: parseInt(e.target.value) || 10 })} />
      </div>
    </div>
  );
}

function AffirmationForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Texto de la afirmación</Label>
        <Textarea rows={3} value={value.text || ''} onChange={e => onChange({ ...value, text: e.target.value })} placeholder="YO SOY CAPAZ DE..." />
      </div>
      <div>
        <Label>Repeticiones</Label>
        <Input type="number" value={value.repeatCount || 3} onChange={e => onChange({ ...value, repeatCount: parseInt(e.target.value) || 3 })} />
      </div>
      <div>
        <Label>Instrucción</Label>
        <Textarea rows={2} value={value.instruction || ''} onChange={e => onChange({ ...value, instruction: e.target.value })} placeholder="Lee en voz alta con convicción..." />
      </div>
    </div>
  );
}

function VideoForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>URL del video</Label>
        <Input value={value.url || ''} onChange={e => onChange({ ...value, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
      </div>
      <div>
        <Label>Plataforma</Label>
        <Select value={value.provider || 'youtube'} onChange={e => onChange({ ...value, provider: e.target.value })}>
          <option value="youtube">YouTube</option>
          <option value="facebook">Facebook</option>
          <option value="vimeo">Vimeo</option>
          <option value="otro">Otro</option>
        </Select>
      </div>
      <div>
        <Label>Duración (segundos)</Label>
        <Input type="number" value={value.duration || 0} onChange={e => onChange({ ...value, duration: parseInt(e.target.value) || 0 })} />
      </div>
      <div>
        <Label>Descripción</Label>
        <Textarea rows={2} value={value.description || ''} onChange={e => onChange({ ...value, description: e.target.value })} />
      </div>
    </div>
  );
}

function QuizForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const questions = value.questions || [];

  const addQuestion = () => {
    onChange({
      ...value,
      questions: [...questions, { id: `q${questions.length + 1}`, text: '', type: 'single', options: ['', ''], correct: 0 }],
    });
  };

  const updateQuestion = (index: number, field: string, val: any) => {
    const updated = questions.map((q: any, i: number) => i === index ? { ...q, [field]: val } : q);
    onChange({ ...value, questions: updated });
  };

  const removeQuestion = (index: number) => {
    onChange({ ...value, questions: questions.filter((_: any, i: number) => i !== index) });
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    updateQuestion(qIndex, 'options', [...q.options, '']);
  };

  const updateOption = (qIndex: number, oIndex: number, val: string) => {
    const q = questions[qIndex];
    const opts = q.options.map((o: string, i: number) => i === oIndex ? val : o);
    updateQuestion(qIndex, 'options', opts);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const q = questions[qIndex];
    updateQuestion(qIndex, 'options', q.options.filter((_: string, i: number) => i !== oIndex));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Puntaje mínimo para aprobar (%)</Label>
        <Input type="number" value={value.passingScore || 70} onChange={e => onChange({ ...value, passingScore: parseInt(e.target.value) || 70 })} />
      </div>
      {questions.map((q: any, qi: number) => (
        <div key={qi} className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Pregunta {qi + 1}</span>
            <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
          <Input value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)} placeholder="¿Pregunta?" />
          <div className="space-y-2">
            {q.options.map((opt: string, oi: number) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correct === oi}
                  onChange={() => updateQuestion(qi, 'correct', oi)}
                  className="w-4 h-4 text-primary-600"
                />
                <Input
                  value={opt}
                  onChange={e => updateOption(qi, oi, e.target.value)}
                  placeholder={`Opción ${oi + 1}`}
                  className="flex-1"
                />
                {q.options.length > 2 && (
                  <button onClick={() => removeOption(qi, oi)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => addOption(qi)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Agregar opción</button>
        </div>
      ))}
      <button onClick={addQuestion} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors">
        + Agregar Pregunta
      </button>
    </div>
  );
}

function MentalExerciseForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const steps = value.steps || [];

  return (
    <div className="space-y-3">
      <div>
        <Label>Instrucción principal</Label>
        <Textarea rows={3} value={value.instruction || ''} onChange={e => onChange({ ...value, instruction: e.target.value })} placeholder="Cierra los ojos y respira profundo..." />
      </div>
      <div>
        <Label>Duración (minutos)</Label>
        <Input type="number" value={value.durationMinutes || 5} onChange={e => onChange({ ...value, durationMinutes: parseInt(e.target.value) || 5 })} />
      </div>
      <div>
        <Label>Pasos de la meditación</Label>
        {steps.map((step: string, i: number) => (
          <div key={i} className="flex items-center gap-2 mt-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold shrink-0">{i + 1}</span>
            <Input value={step} onChange={e => {
              const updated = [...steps]; updated[i] = e.target.value;
              onChange({ ...value, steps: updated });
            }} placeholder="Paso..." className="flex-1" />
            <button onClick={() => onChange({ ...value, steps: steps.filter((_: string, j: number) => j !== i) })} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => onChange({ ...value, steps: [...steps, ''] })} className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium">+ Agregar paso</button>
      </div>
    </div>
  );
}

function ConfidenceTaskForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Descripción de la tarea</Label>
        <Textarea rows={3} value={value.task || ''} onChange={e => onChange({ ...value, task: e.target.value })} placeholder="Escribe algo y compártelo con..." />
      </div>
      <div>
        <Label>Tipo de evidencia</Label>
        <Select value={value.evidenceType || 'text'} onChange={e => onChange({ ...value, evidenceType: e.target.value })}>
          <option value="text">Texto</option>
          <option value="photo">Foto</option>
          <option value="video">Video</option>
        </Select>
      </div>
      <div>
        <Label>Dato o explicación</Label>
        <Textarea rows={2} value={value.description || ''} onChange={e => onChange({ ...value, description: e.target.value })} placeholder="Estudios muestran que..." />
      </div>
    </div>
  );
}

function InteractiveExerciseForm({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const exType = value.type || 'matching';

  const setType = (type: string) => {
    const defaults: Record<string, any> = {
      matching: { type: 'matching', instruction: 'Conecta cada objeción con su respuesta correcta', pairs: [{ left: '', right: '' }] },
      ordering: { type: 'ordering', instruction: 'Ordena los pasos del proceso', items: [''] },
      scenarios: { type: 'scenarios', instruction: 'Elige la mejor respuesta', scenarios: [{ situation: '', options: ['', ''], correct: 0, explanation: '' }] },
      fill_blanks: { type: 'fill_blanks', instruction: 'Completa la frase', sentences: [{ id: 's1', text: 'La ___ es el arte de...', answer: '' }] },
      scale: { type: 'scale', instruction: 'Evalúa del 1 al 10', questions: [{ id: 'q1', question: '', lowLabel: 'Bajo', highLabel: 'Alto' }] },
      puzzle: { type: 'puzzle', instruction: 'Arrastra las piezas al lugar correcto', pieces: [''], slots: ['___ es...'] },
    };
    onChange({ ...defaults[type], instruction: value.instruction || defaults[type].instruction });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Tipo de ejercicio</Label>
        <Select value={exType} onChange={e => setType(e.target.value)}>
          <option value="matching">🔗 Conectar Pares (Matching)</option>
          <option value="ordering">📋 Ordenar Pasos</option>
          <option value="scenarios">🎭 Escenarios de Venta</option>
          <option value="fill_blanks">✏️ Completar Frases</option>
          <option value="scale">📊 Autoevaluación (Escala)</option>
          <option value="puzzle">🧩 Rompecabezas</option>
        </Select>
      </div>
      <div>
        <Label>Instrucción</Label>
        <Textarea rows={2} value={value.instruction || ''} onChange={e => onChange({ ...value, instruction: e.target.value })} />
      </div>
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs text-gray-500">
          El contenido se edita con formularios especiales por tipo. Edita el JSON directamente si necesitas ajustes avanzados.
        </p>
        <Textarea
          rows={6}
          className="font-mono text-xs mt-2"
          value={JSON.stringify(value, null, 2)}
          onChange={e => { try { onChange(JSON.parse(e.target.value)); } catch {} }}
        />
      </div>
    </div>
  );
}

const formComponents: Record<string, React.ComponentType<{ value: any; onChange: (v: any) => void }>> = {
  REFLECTION: ReflectionForm,
  AFFIRMATION: AffirmationForm,
  VIDEO: VideoForm,
  QUIZ: QuizForm,
  MENTAL_EXERCISE: MentalExerciseForm,
  CONFIDENCE_TASK: ConfidenceTaskForm,
  INTERACTIVE_EXERCISE: InteractiveExerciseForm,
};

export function AdminDayDetailPage() {
  const { dayId } = useParams<{ dayId: string }>();
  const { days, fetchDays, createContent, updateContent, deleteContent, reorderContents } = useAdminStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('REFLECTION');
  const [formTitle, setFormTitle] = useState('');
  const [formOrderIndex, setFormOrderIndex] = useState(0);
  const [formIsRequired, setFormIsRequired] = useState(true);
  const [formContentData, setFormContentData] = useState<any>({});
  const [previewContent, setPreviewContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (dayId) fetchDays();
  }, [dayId, fetchDays]);

  const currentDay = days.find(d => d.id === dayId);
  const contents: ContentItem[] = (currentDay?.contents || []).sort((a, b) => a.orderIndex - b.orderIndex);

  const resetForm = () => {
    setEditingContent(null);
    setSelectedType('REFLECTION');
    setFormTitle('');
    setFormOrderIndex(contents.length);
    setFormIsRequired(true);
    setFormContentData({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setSelectedType(content.type);
    setFormTitle(content.title);
    setFormOrderIndex(content.orderIndex);
    setFormIsRequired(content.isRequired);
    setFormContentData(content.content);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) { toast.error('El título es requerido'); return; }
    setSubmitting(true);
    try {
      const payload = {
        type: selectedType,
        title: formTitle,
        content: formContentData,
        orderIndex: formOrderIndex,
        isRequired: formIsRequired,
      };
      if (editingContent) {
        await updateContent(editingContent.id, payload);
        toast.success('Contenido actualizado');
      } else {
        await createContent({ ...payload, dayId: dayId! });
        toast.success('Contenido creado');
      }
      setShowForm(false);
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  const FormComponent = formComponents[selectedType];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ButtonGhost onClick={() => navigate('/admin/days')}><ChevronLeft className="w-4 h-4" /></ButtonGhost>
          <PageHeader
            title={`Día ${currentDay.dayNumber}: ${currentDay.title}`}
            subtitle={`${contents.length} contenidos`}
            icon={BookOpen}
          />
        </div>
        <ButtonPrimary onClick={resetForm} className="shrink-0"><Plus className="w-4 h-4 mr-2" /> Agregar Contenido</ButtonPrimary>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{editingContent ? 'Editar' : 'Nuevo'} Contenido</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo de Contenido</Label>
              <Select value={selectedType} onChange={e => { setSelectedType(e.target.value); setFormContentData({}); }} className="w-full">
                {Object.entries(contentTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <div>
              <Label>Título</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Título del contenido" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Orden</Label>
                <Input type="number" value={formOrderIndex} onChange={e => setFormOrderIndex(parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="isRequired" checked={formIsRequired} onChange={e => setFormIsRequired(e.target.checked)} className="w-4 h-4 rounded text-primary-600" />
                <Label htmlFor="isRequired" className="mb-0">Requerido para avanzar</Label>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <Label className="text-base font-semibold">Configuración del Contenido</Label>
              {FormComponent && <div className="mt-3"><FormComponent value={formContentData} onChange={setFormContentData} /></div>}
            </div>
            <div className="flex gap-3 pt-2">
              <ButtonPrimary onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />} {editingContent ? 'Actualizar' : 'Crear'}
              </ButtonPrimary>
              <ButtonGhost onClick={() => setShowForm(false)}>Cancelar</ButtonGhost>
            </div>
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
                  <SortableContentItem key={content.id} content={content} index={index} onEdit={handleEdit} onDelete={handleDelete} onPreview={setPreviewContent} />
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

      {/* Vista previa */}
      <Dialog open={!!previewContent} onOpenChange={(open) => { if (!open) setPreviewContent(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">
              Vista Previa: {previewContent?.title || ''}
              {previewContent && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-primary-100 text-primary-600 align-middle whitespace-nowrap">
                  {contentTypeLabels[previewContent.type as string] || previewContent.type}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewContent && (
            <ContentRenderer
              content={previewContent as any}
              dayNumber={currentDay.dayNumber}
              preview
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
