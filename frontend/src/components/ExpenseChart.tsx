'use client';

interface DataItem {
  name: string;
  value: number;
}

const COLORS = ['#059669', '#6366f1', '#d97706'];

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ExpenseChart({ data }: { data: DataItem[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 py-8">Sem dados no mês</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3 py-2">
      {data.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-20 text-sm text-slate-600 shrink-0">{item.name}</span>
          <div className="flex-1 h-8 bg-slate-100 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-300"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
          <span className="text-sm font-medium text-slate-700 w-24 text-right shrink-0">
            {formatMoney(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
