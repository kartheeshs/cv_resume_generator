import { AuthGuard } from '@/components/AuthGuard';
import { ResumeDashboard } from '@/components/ResumeDashboard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <ResumeDashboard />
    </AuthGuard>
  );
}
