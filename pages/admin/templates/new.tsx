import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../../components/admin/AdminLayout';
import TemplateBuilder from '../../../components/admin/TemplateBuilder';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function NewTemplate() {
  const router = useRouter();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);

  const handleSave = async (templateData: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateData,
          createdBy: session?.user?.id,
        }),
      });

      if (res.ok) {
        const template = await res.json();
        router.push(`/admin/templates/${template.id}`);
      } else {
        alert('Failed to create template');
      }
    } catch (error) {
      alert('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <TemplateBuilder
        onSave={handleSave}
        saving={saving}
      />
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
