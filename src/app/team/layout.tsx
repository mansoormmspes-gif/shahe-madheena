export const dynamic = 'force-dynamic';
import ClientLayout from './ClientLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
