import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea, Label, ButtonPrimary } from '@/components/ui';
import { useProgramStore } from '@/store/programStore';
import { Loader2, Save, CheckCircle } from 'lucide-react';

const reflectionSchema = z.object({
  content: z.string().min(1, 'Escribe algo...'),
});

type ReflectionFormData = z.infer<typeof reflectionSchema>;

interface ReflectionFormProps {
  dayId: string;
  reflectionType: 'DREAMS' | 'FEARS' | 'ENTHUSIASM' | 'CUSTOM';
  title: string;
  prompt: string;
  placeholder: string;
  minChars?: number;
  initialContent?: string;
}

const typeIcons = {
  DREAMS: '🎯',
  FEARS: '😨',
  ENTHUSIASM: '💪',
  CUSTOM: '📝',
};

const typeLabels = {
  DREAMS: 'Sueños',
  FEARS: 'Miedos',
  ENTHUSIASM: 'Entusiasmo',
  CUSTOM: 'Reflexión',
};

export function ReflectionForm({ dayId, reflectionType, title, prompt, placeholder, minChars = 10, initialContent }: ReflectionFormProps) {
  const { saveReflection } = useProgramStore();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [charCount, setCharCount] = useState(initialContent?.length || 0);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReflectionFormData>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: { content: initialContent || '' },
    mode: 'onChange',
  });

  const content = watch('content');
  useEffect(() => setCharCount(content.length), [content]);

  const onSubmit = async (data: ReflectionFormData) => {
    setSaving(true);
    try {
      await saveReflection({ dayId, reflectionType, content: data.content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-gradient-to-br from-primary-50/50 to-transparent rounded-xl border border-primary-200/50">
      <div className="flex items-center gap-3">
        <span className="text-xl sm:text-2xl">{typeIcons[reflectionType]}</span>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm ml-8 break-words">{prompt}</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor={`reflection-${reflectionType}`}>{typeLabels[reflectionType]}</Label>
          <Textarea
            id={`reflection-${reflectionType}`}
            placeholder={placeholder}
            rows={5}
            {...register('content')}
            className="font-medium"
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{charCount} / {minChars} mín.</span>
            {saved && <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Guardado</span>}
          </div>
        </div>
        <ButtonPrimary type="submit" disabled={saving || content.length < minChars} className="w-full">
          {saving ? <Loader2 className="w-4 h-4" /> : saved ? 'Guardado ✓' : 'Guardar'}
        </ButtonPrimary>
      </form>
    </div>
  );
}
