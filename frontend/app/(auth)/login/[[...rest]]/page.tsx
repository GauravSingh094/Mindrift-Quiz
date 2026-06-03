import { SignIn } from '@clerk/nextjs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Mindrift',
  description: 'Login to your Mindrift account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 px-4 py-12">
      <SignIn path="/login" signUpUrl="/register" forceRedirectUrl="/dashboard" />
    </div>
  );
}
