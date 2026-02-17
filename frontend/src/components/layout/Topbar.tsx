'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Bell, PlusCircle, Sun, Moon, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { useAlerts } from '@/hooks/use-dashboard';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface TopbarProps {
  balanceTotal: number;
}

export function Topbar({ balanceTotal }: TopbarProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: alerts } = useAlerts();
  const initial = user?.email?.slice(0, 1).toUpperCase() ?? 'U';

  const dueTodayCount = alerts?.dueToday?.length ?? 0;
  const overdueCount = alerts?.overdue?.length ?? 0;
  const invoiceClosedCount = alerts?.invoiceClosed?.length ?? 0;
  const totalAlerts = dueTodayCount + overdueCount + invoiceClosedCount;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex flex-1 items-center gap-4">
        <span className="hidden font-semibold md:inline-block">Financeiro</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="rounded-lg bg-muted/80 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Saldo total</span>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatMoney(balanceTotal)}
            </p>
          </div>
          <Link href="/transactions">
            <Button size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Transação</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                <Bell className="h-5 w-5" />
                {totalAlerts > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!alerts ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Carregando…
                </div>
              ) : totalAlerts === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum alerta no momento.
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2">
                  {dueTodayCount > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 px-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Vencendo hoje
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {alerts.dueToday.map((a) => (
                          <li key={a.id} className="px-2 py-1 text-sm">
                            {a.description} — {formatMoney(a.amount)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {overdueCount > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 px-2 text-xs font-semibold text-destructive">
                        <AlertCircle className="h-3.5 w-3.5" /> Atrasadas
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {alerts.overdue.map((a) => (
                          <li key={a.id} className="px-2 py-1 text-sm">
                            {a.description} — {formatMoney(a.amount)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {invoiceClosedCount > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 px-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                        <Info className="h-3.5 w-3.5" /> Fatura fechada
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {alerts.invoiceClosed.map((inv, i) => (
                          <li key={`${inv.cardName}-${i}`} className="px-2 py-1 text-sm">
                            {inv.cardName}: {formatMoney(inv.totalUnpaid)} — vence dia {inv.dueDay}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer">Ver dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/transactions" className="cursor-pointer">Ver transações</Link>
                  </DropdownMenuItem>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="font-normal">Minha conta</span>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Configurações</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
