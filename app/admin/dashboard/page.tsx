import { redirect } from 'next/navigation';

export default function LegacyAdminDashboardRoute() {
  redirect('/admin');
}
