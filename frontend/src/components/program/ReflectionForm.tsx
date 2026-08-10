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
  DREAMS: 'ðŸŽ¯',
  FEARS: 'ðŸ˜¨',
  ENTHUSIASM: 'ðŸ’ª',
  CUSTOM: 'ðŸ“',
};

const typeLabels = {
  DREAMS: 'SueÃ±os',
  FEARS: 'Miedos',
  ENTHUSIASM: 'Entusiasmo',
  CUSTOM: 'ReflexiÃ³n',
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
    <div className="space-y-4 p-6 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/20 rounded-xl border border-primary-200/50 dark:border-primary-800/50">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{typeIcons[reflectionType]}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm ml-8">{prompt}</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor={`reflection-${reflectionType}`}>{typeLabels[reflectionType]}</Label>
          <Textarea
            id={`reflection-${reflectionType}`}
            placeholder={placeholder}
            rows={6}
            {...register('content')}
            className="font-medium"
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{charCount} / {minChars} caracteres mÃ­n.</span>
            {saved && <span className="text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Guardado</span>}
          </div>
        </div>
        <ButtonPrimary type="submit" disabled={saving || content.length < minChars} className="w-full">
          {saving ? <Loader2 className="w-4 h-4" /> : saved ? 'Guardado âœ“' : 'Guardar ReflexiÃ³n'}
        </ButtonPrimary>
      </form>
    </div>
  );
}