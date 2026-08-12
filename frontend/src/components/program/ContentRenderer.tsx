import { DayContent } from '@/store/programStore';
import { ReflectionForm } from './ReflectionForm';
import { AffirmationCard } from './AffirmationCard';
import { VideoPlayer } from './VideoPlayer';
import { QuizComponent } from './QuizComponent';
import { MentalExercise } from './MentalExercise';
import { ConfidenceTask } from './ConfidenceTask';
import { InteractiveExercise } from './InteractiveExercise';
import { useProgramStore } from '@/store/programStore';
import { Card, CardContent } from '@/components/ui';

interface ContentRendererProps {
  content: DayContent;
  dayNumber: number;
  onCompleted?: () => void;
  preview?: boolean;
}

export function ContentRenderer({ content, dayNumber, onCompleted, preview = false }: ContentRendererProps) {
  const { completeContent, saveReflection, progress } = useProgramStore();
  const userProgress = preview ? undefined : progress.find(p => p.contentId === content.id);
  const completed = preview ? false : userProgress?.status === 'COMPLETED';

  const handleComplete = async () => {
    if (!preview) await completeContent(dayNumber, content.id);
    onCompleted?.();
  };

  const handleReflectionSave = async (data: any) => {
    if (!preview) {
      await saveReflection({ dayId: content.dayId, reflectionType: data.reflectionType, content: data.content });
      if (content.isRequired) {
        await completeContent(dayNumber, content.id, { content: data.content });
      }
    }
    onCompleted?.();
  };

  const baseProps = {
    title: content.title,
    onComplete: handleComplete,
    completed,
  };

  switch (content.type) {
    case 'REFLECTION': {
      const { prompt, placeholder, minChars = 10 } = content.content;
      const reflectionType = prompt.includes('sueño') ? 'DREAMS' : 
                           prompt.includes('miedo') ? 'FEARS' : 
                           prompt.includes('entusiasmo') ? 'ENTHUSIASM' : 'CUSTOM';
      return (
        <ReflectionForm
          {...baseProps}
          dayId={content.dayId}
          reflectionType={reflectionType}
          prompt={prompt}
          placeholder={placeholder}
          minChars={minChars}
          initialContent={userProgress?.answers?.content}
          onSave={handleReflectionSave}
        />
      );
    }
    case 'AFFIRMATION': {
      const { text, repeatCount = 3, instruction } = content.content;
      return (
        <AffirmationCard
          {...baseProps}
          text={text}
          repeatCount={repeatCount}
          instruction={instruction}
        />
      );
    }
    case 'VIDEO': {
      const { url, provider, duration, description, author } = content.content;
      return (
        <VideoPlayer
          {...baseProps}
          url={url}
          provider={provider}
          duration={duration}
          description={description}
          author={author}
        />
      );
    }
    case 'QUIZ': {
      const { questions, passingScore = 70 } = content.content;
      return (
        <QuizComponent
          {...baseProps}
          questions={questions}
          passingScore={passingScore}
          initialAnswers={userProgress?.answers}
        />
      );
    }
    case 'MENTAL_EXERCISE': {
      const { instruction, durationMinutes, steps } = content.content;
      return (
        <MentalExercise
          {...baseProps}
          instruction={instruction}
          durationMinutes={durationMinutes}
          steps={steps}
        />
      );
    }
    case 'CONFIDENCE_TASK': {
      const { task, evidenceType, description } = content.content;
      return (
        <ConfidenceTask
          {...baseProps}
          task={task}
          evidenceType={evidenceType}
          description={description}
          initialEvidence={userProgress?.answers?.evidence}
        />
      );
    }
    case 'INTERACTIVE_EXERCISE': {
      const { type: exerciseType, instruction, ...exerciseData } = content.content;
      return (
        <InteractiveExercise
          {...baseProps}
          title={content.title}
          exercise={{ type: exerciseType, instruction, data: exerciseData }}
        />
      );
    }
    default:
      return (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Tipo de contenido no soportado: {content.type}
          </CardContent>
        </Card>
      );
  }
}
