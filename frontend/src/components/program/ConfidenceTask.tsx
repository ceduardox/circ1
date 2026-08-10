import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ButtonPrimary, ButtonGhost, Input, Label, Textarea } from '@/components/ui';
import { CheckCircle, Send, Camera, Mic } from 'lucide-react';

const taskSchema = z.object({
  evidence: z.string().min(10, 'Describe qué hiciste o comparte tu evidencia'),
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

  const icons = { text: '✍️', photo: '📸', audio: '🎤' };
  const labels = { text: 'Escribe tu experiencia', photo: 'Sube una foto', audio: 'Graba audio' };

  if (completed) {
    return (
      <div className="p-4 sm:p-6 rounded-xl border-2 bg-green-50 border-green-300">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <span className="text-2xl sm:text-3xl">💼</span>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-green-600 p-3 sm:p-4 bg-green-100 rounded-lg">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm break-words">{initialEvidence}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 rounded-xl border-2 bg-orange-50 border-orange-300">
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <span className="text-2xl sm:text-3xl">💼</span>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-2 break-words">{task}</p>
      {description && <p className="text-xs text-gray-500 mb-4 break-words">{description}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Evidencia ({labels[evidenceType]})</Label>
          {evidenceType === 'text' ? (
            <Textarea
              placeholder="Describe qué hiciste, cómo te sentiste..."
              rows={4}
              {...register('evidence')}
            />
          ) : evidenceType === 'photo' ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
              <Camera className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Subida de foto próximamente</p>
              <Textarea
                placeholder="Describe qué hiciste..."
                rows={3}
                {...register('evidence')}
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
              <Mic className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Audio próximamente</p>
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
          {submitted ? 'Enviado ✓' : 'Enviar'}
        </ButtonPrimary>
      </form>
    </div>
  );
}
