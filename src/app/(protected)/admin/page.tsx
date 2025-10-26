import { AuthGuard } from '@/components/AuthGuard';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function AdminPage() {
  return (
    <AuthGuard requireAdmin>
      <AdminDashboard />
    </AuthGuard>
  );
}
