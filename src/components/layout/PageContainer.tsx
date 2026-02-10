import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
      {children}
    </main>
  );
}
