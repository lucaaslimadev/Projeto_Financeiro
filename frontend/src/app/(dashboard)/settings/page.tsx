'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function SettingsPage() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLinkTelegram() {
    setError('');
    setCode(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ code: string; expiresAt: string }>('/auth/telegram-link-code');
      setCode(data.code);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string }; status?: number } }).response
        : null;
      setError(res?.data?.error ?? res?.status === 429
        ? 'Muitas tentativas. Aguarde alguns minutos.'
        : 'Não foi possível gerar o código. Tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>

      <Card className="bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-800">Vincular Telegram</h2>
          <p className="mt-1 text-sm text-slate-600">
            Vincule sua conta ao bot do Telegram para enviar despesas por mensagem (ex.: 100 gasolina).
          </p>
          {!code ? (
            <div className="mt-4">
              <Button onClick={handleLinkTelegram} disabled={loading}>
                {loading ? 'Gerando…' : 'Gerar código de vínculo'}
              </Button>
              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}
            </div>
          ) : (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm font-medium text-slate-700">Envie este código ao bot no Telegram:</p>
              <p className="mt-2 text-2xl font-mono font-bold text-emerald-800 tracking-widest">{code}</p>
              <p className="mt-2 text-xs text-slate-600">
                O código vale por 5 minutos. Abra o chat do bot e envie apenas o número acima.
              </p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setCode(null)}>
                Gerar outro código
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-800">Histórico de ajustes de saldo</h2>
          <p className="mt-1 text-sm text-slate-600">
            Os ajustes de saldo (quando você usa &quot;Ajustar saldo&quot; no dashboard) são registrados como transações do tipo Ajuste.
            Para ver o histórico, vá em Transações e use o filtro por tipo: <strong>Ajuste</strong>.
          </p>
          <Link href="/transactions">
            <Button variant="outline" size="sm" className="mt-4">Ver transações</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
