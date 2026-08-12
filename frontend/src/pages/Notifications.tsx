import { Bell } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { PushNotificationsPanel } from '@/components/program/PushNotificationsPanel';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones Push"
        subtitle="Administra qué avisos recibes en tu navegador"
        icon={Bell}
      />
      <PushNotificationsPanel />
    </div>
  );
}
