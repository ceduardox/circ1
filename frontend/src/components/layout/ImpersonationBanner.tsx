import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function ImpersonationBanner() {
  const imp = useAuthStore(s => s.impersonation);
  const user = useAuthStore(s => s.user);
  const stop = useAuthStore(s => s.stopImpersonation);
  const navigate = useNavigate();

  if (!imp) return null;

  return (
    <div className="bg-amber-500 text-white text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-2 shadow-sm">
      <ShieldAlert className="w-4 h-4 shrink-0" />
      <span>Viendo como <b>{user?.firstName || user?.username}</b> <span className="opacity-80">(@{user?.username})</span></span>
      <button
        onClick={() => { stop(); navigate('/admin'); }}
        className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-amber-700 font-bold text-xs hover:bg-amber-50 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Volver a admin
      </button>
    </div>
  );
}
