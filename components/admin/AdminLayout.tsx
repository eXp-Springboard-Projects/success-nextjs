import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { Department } from '@/lib/types';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [currentDept, setCurrentDept] = useState<Department>(Department.SUPER_ADMIN);

  useEffect(() => {
    // Determine the active department based on the URL path
    const path = router.pathname;

    if (path.includes('/admin/customer-service') ||
        path.includes('/admin/sales') ||
        path.includes('/admin/orders') ||
        path.includes('/admin/refunds') ||
        path.includes('/admin/members')) {
      setCurrentDept(Department.CUSTOMER_SERVICE);
    } else if (path.includes('/admin/editorial') ||
               path.includes('/admin/posts') ||
               path.includes('/admin/pages') ||
               path.includes('/admin/videos') ||
               path.includes('/admin/podcasts') ||
               path.includes('/admin/categories') ||
               path.includes('/admin/tags') ||
               path.includes('/admin/media') ||
               path.includes('/admin/comments')) {
      setCurrentDept(Department.EDITORIAL);
    } else if (path.includes('/admin/success-plus') ||
               path.includes('/admin/resources')) {
      setCurrentDept(Department.SUCCESS_PLUS);
    } else if (path.includes('/admin/dev') || path.includes('/admin/devops')) {
      setCurrentDept(Department.DEV);
    } else if (path.includes('/admin/marketing') || path.includes('/admin/crm') || path.includes('/admin/social-media')) {
      setCurrentDept(Department.MARKETING);
    } else if (path.includes('/admin/coaching')) {
      setCurrentDept(Department.COACHING);
    } else {
      // Default to Super Admin for the main dashboard index
      setCurrentDept(Department.SUPER_ADMIN);
    }
  }, [router.pathname]);

  // We wrap the content in the same layout used by the Refunds page
  return (
    <DepartmentLayout 
      currentDepartment={currentDept}
      // We leave title/desc empty here so individual pages can override them, 
      // or set generic defaults:
      pageTitle='Admin Dashboard'
      description='Welcome back'
    >
      {children}
    </DepartmentLayout>
  );
}
