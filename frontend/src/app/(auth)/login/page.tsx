'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { message?: string; error?: string } } }).response : null;
      const status = res?.status;
      const data = res?.data;
      const apiMsg = data?.error ?? data?.message ?? (err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : '');
      const isAuthError = status === 401 || /invalid|credencial|unauthorized|senha|password/i.test(apiMsg || '');
      setError(isAuthError ? 'E-mail ou senha inválidos. Tente novamente.' : (apiMsg || 'Erro ao entrar. Verifique se a API está acessível.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur shadow-xl">
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-800">Entrar</h1>
        <p className="mt-1 text-slate-600 text-sm">Controle financeiro pessoal</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Entrando…
              </span>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Não tem conta?{' '}
          <Link href="/register" className="font-medium text-emerald-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </Card>
  );
}
