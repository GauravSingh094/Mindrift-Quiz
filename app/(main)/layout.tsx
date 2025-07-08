import { Header } from '@/components/layout/header';
import { SpaceBackground } from '@/components/animations/space-background';
import { SharedFooter } from '@/components/layout/shared-footer';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen flex flex-col">
        <SpaceBackground />
        <Header />
        <main className="pt-20 pb-10 relative z-10 flex-1">
          {children}
        </main>
        <SharedFooter />
      </div>
    </AuthGuard>
  );
}