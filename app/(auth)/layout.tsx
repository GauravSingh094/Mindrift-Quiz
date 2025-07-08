import { SpaceBackground } from '@/components/animations/space-background';
import { SharedFooter } from '@/components/layout/shared-footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SpaceBackground />
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md px-4">
          {children}
        </div>
      </div>
      <SharedFooter />
    </div>
  );
}