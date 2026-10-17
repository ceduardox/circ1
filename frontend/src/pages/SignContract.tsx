import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileSignature, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { contractsApi } from '@/services/api';
import { ContractText } from '@/components/ui/ContractText';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { ButtonPrimary } from '@/components/ui';
import { toast } from 'sonner';

export function SignContractPage() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sigImage, setSigImage] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    contractsApi.publicGet(token)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Link no válido'))
      .finally(() => setLoading(false));
  }, [token]);

  const sign = async () => {
    if (!token) return;
    if (!sigImage) { toast.error('Dibuja tu firma'); return; }
    setSigning(true);
    try {
      await contractsApi.publicSign(token, sigImage);
      setDone(true);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al firmar');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-900 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700 flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary-600" />
          <h1 className="font-bold text-gray-900 dark:text-dark-100">Firma de contrato</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
            <p className="text-sm text-gray-700 dark:text-dark-200">{error}</p>
          </div>
        ) : done ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
            <p className="font-semibold text-gray-900 dark:text-dark-100">¡Firma registrada!</p>
            <p className="text-sm text-gray-500 dark:text-dark-400 mt-1">Gracias, {data?.name}. Tu firma quedó adjunta al contrato.</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-dark-100">{data.contract.title}</h2>
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">Fecha del contrato: {new Date(data.contract.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-gray-100 dark:border-dark-700 p-4">
              <ContractText text={data.contract.body} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-dark-100">Firma de <b>{data.name}</b></p>
              <p className="text-xs text-gray-500 dark:text-dark-400 mb-1">Dibuja tu firma con el mouse o el dedo.</p>
              <SignaturePad onChange={setSigImage} />
            </div>
            <ButtonPrimary onClick={sign} disabled={signing}>
              {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />} Firmar contrato
            </ButtonPrimary>
          </div>
        )}
      </div>
    </div>
  );
}
