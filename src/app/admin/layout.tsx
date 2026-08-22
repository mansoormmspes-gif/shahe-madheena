export const dynamic = 'force-dynamic';
export const revalidate = 0;
import ClientLayout from './ClientLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
