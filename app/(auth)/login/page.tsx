import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login | Mindrift',
  description: 'Login to your Mindrift account',
};

export default function LoginPage() {
  return <LoginForm />;
}