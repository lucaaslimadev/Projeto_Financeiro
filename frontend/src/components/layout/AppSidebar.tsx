'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  FileText,
  Wallet,
  Target,
  BarChart3,
  Settings,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: Receipt },
  { href: '/variable-expenses', label: 'Despesas variáveis', icon: Wallet },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/cards', label: 'Cartões', icon: CreditCard },
  { href: '/fixed-bills', label: 'Contas Fixas', icon: FileText },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </Link>
      ))}
    </>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden border-r bg-card md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 md:left-0 z-30">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="font-semibold text-lg text-foreground">
            Financeiro
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <NavLinks />
        </nav>
        <div className="border-t p-3">
          <p className="truncate px-2 text-xs text-muted-foreground" title={user?.email ?? ''}>
            {user?.email ?? 'Usuário'}
          </p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={logout}>
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile: sheet trigger */}
      <div className="flex items-center gap-2 border-b bg-card px-4 py-2 md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b p-4 text-left">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              <NavLinks onLinkClick={() => setSheetOpen(false)} />
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t p-3">
              <p className="truncate px-2 text-xs text-muted-foreground">{user?.email ?? 'Usuário'}</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={logout}>
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="font-semibold text-foreground">
          Financeiro
        </Link>
      </div>
    </>
  );
}
