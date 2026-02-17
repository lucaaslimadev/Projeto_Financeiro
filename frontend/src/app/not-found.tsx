import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <h1 className="text-2xl font-bold text-slate-800">Página não encontrada</h1>
      <Link href="/" className="mt-4 text-emerald-600 hover:underline">Voltar ao início</Link>
    </div>
  );
}
