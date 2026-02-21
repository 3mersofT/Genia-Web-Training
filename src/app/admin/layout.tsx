import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Vérifier le rôle admin avec contournement temporaire
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  // Contournement temporaire - utiliser l'email si pas de profile
  let userRole = profile?.role;
  if (!userRole && user.email) {
    if (user.email.includes('admin@') || user.email.startsWith('admin@')) {
      userRole = 'admin';
      console.log('Admin layout: Using email-based admin access');
    }
  }

  if (userRole !== 'admin') {
    console.log('Admin layout: Access denied, redirecting to dashboard. Role:', userRole);
    redirect('/dashboard');
  }

  console.log('Admin layout: Admin access granted, role:', userRole);

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}