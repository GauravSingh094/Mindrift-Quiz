import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Register | Mindrift',
  description: 'Create your Mindrift account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}