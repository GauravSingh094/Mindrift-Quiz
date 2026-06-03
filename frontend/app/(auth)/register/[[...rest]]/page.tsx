import { SignUp } from '@clerk/nextjs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Mindrift',
  description: 'Create your Mindrift account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 px-4 py-12">
      <SignUp path="/register" signInUrl="/login" forceRedirectUrl="/dashboard" />
    </div>
  );
}
