import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import TemplateBuilder from '../../../../components/admin/TemplateBuilder';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function EditTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [templateData, setTemplateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/admin/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplateData(data);
      } else {
        alert('Template not found');
        router.push('/admin/templates');
      }
    } catch (error) {
      alert('Failed to load template');
      router.push('/admin/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setTemplateData(updated);
        alert('Template saved successfully');
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading template...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <TemplateBuilder
        templateId={id as string}
        initialData={templateData}
        onSave={handleSave}
        saving={saving}
      />
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
