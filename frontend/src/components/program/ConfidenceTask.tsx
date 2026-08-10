import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ButtonPrimary, ButtonGhost, Input, Label, Textarea } from '@/components/ui';
import { CheckCircle, Send, Camera, Mic } from 'lucide-react';

const taskSchema = z.object({
  evidence: z.string().min(10, 'Describe quÃ© hiciste o comparte tu evidencia'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface ConfidenceTaskProps {
  title: string;
  task: string;
  evidenceType: 'text' | 'photo' | 'audio';
  description?: string;
  onComplete: (evidence: string) => void;
  completed?: boolean;
  initialEvidence?: string;
}

export function ConfidenceTask({ title, task, evidenceType, description, onComplete, completed, initialEvidence }: ConfidenceTaskProps) {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: { evidence: initialEvidence || '' },
  });

  const evidence = watch('evidence');

  const onSubmit = (data: TaskFormData) => {
    onComplete(data.evidence);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const icons = { text: 'âœï¸', photo: 'ðŸ“¸', audio: 'ðŸŽ¤' };
  const labels = { text: 'Escribe tu experiencia', photo: 'Sube una foto', audio: 'Graba audio' };

  if (completed) {
    return (
      <div className="p-6 rounded-xl border-2 bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">ðŸ’¼</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Reto completado: {initialEvidence}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl border-2 bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">ðŸ’¼</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-2">{task}</p>
      {description && <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">{description}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Evidencia ({labels[evidenceType]})</Label>
          {evidenceType === 'text' ? (
            <Textarea
              placeholder="Describe quÃ© hiciste, cÃ³mo te sentiste, quÃ© aprendiste..."
              rows={4}
              {...register('evidence')}
            />
          ) : evidenceType === 'photo' ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Funcionalidad de subida de foto prÃ³ximamente</p>
              <Textarea
                placeholder="Mientras tanto, describe quÃ© hiciste..."
                rows={3}
                {...register('evidence')}
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Mic className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Funcionalidad de audio prÃ³ximamente</p>
              <Textarea
                placeholder="Describe tu experiencia..."
                rows={3}
                {...register('evidence')}
              />
            </div>
          )}
          {errors.evidence && <p className="text-red-500 text-sm mt-1">{errors.evidence.message}</p>}
        </div>
        <ButtonPrimary type="submit" disabled={evidence.length < 10} className="w-full">
          <Send className="w-4 h-4 mr-2" />
          {submitted ? 'Enviado âœ“' : 'Enviar Evidencia'}
        </ButtonPrimary>
      </form>
    </div>
  );
}