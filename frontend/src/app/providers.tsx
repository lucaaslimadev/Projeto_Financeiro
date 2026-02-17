'use client';

import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SWRConfig
        value={{
          revalidateOnFocus: true,
          revalidateIfStale: true,
          dedupingInterval: 2000,
          errorRetryCount: 2,
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </SWRConfig>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
