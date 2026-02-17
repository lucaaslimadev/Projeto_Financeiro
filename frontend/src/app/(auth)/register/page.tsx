'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') console.error('[Cadastro]', err);
      const ax = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string; error?: string; details?: unknown }; status?: number }; code?: string })
        : null;
      const res = ax?.response?.data;
      const msg = res?.error ?? res?.message ?? (res?.details ? 'Dados inválidos.' : null);
      const isNetworkError = !ax?.response && (ax?.code === 'ERR_NETWORK' || (err as Error)?.message?.includes('Network'));
      const fallback = isNetworkError
        ? 'Não foi possível conectar à API. Verifique se o backend está rodando e se NEXT_PUBLIC_API_URL está correto (ex.: http://localhost:3011/api/v1).'
        : 'Erro ao cadastrar. Verifique os dados e se a API está acessível.';
      setError(msg || fallback);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur shadow-xl">
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-800">Cadastro</h1>
        <p className="mt-1 text-slate-600 text-sm">Crie sua conta</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Nome"
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
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
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Cadastrando…' : 'Cadastrar'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </Card>
  );
}
