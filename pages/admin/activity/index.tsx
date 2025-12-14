import { Department } from '@prisma/client';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import ActivityFeed from '@/components/admin/shared/ActivityFeed';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { GetServerSidePropsContext } from 'next';

interface ActivityPageProps {
  userDepartment: Department;
}

export default function ActivityPage({ userDepartment }: ActivityPageProps) {
  return (
    <DepartmentLayout
      currentDepartment={userDepartment}
      pageTitle="Activity Feed"
      description="Company-wide activity across all departments"
    >
      <ActivityFeed showFilters={true} limit={50} />
    </DepartmentLayout>
  );
}

// Allow access from any department
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Use requireDepartmentAuth with user's primary department
  // For activity feed, we allow all authenticated users
  const result = await requireDepartmentAuth(Department.CUSTOMER_SERVICE)(context);

  // If redirected (not authenticated), return the redirect
  if ('redirect' in result) {
    return result;
  }

  if ('notFound' in result) {
    return result;
  }

  // Extract user's department from session
  const userDepartment = (result.props as any).session?.user?.primaryDepartment || Department.CUSTOMER_SERVICE;

  return {
    props: {
      userDepartment,
    },
  };
}
