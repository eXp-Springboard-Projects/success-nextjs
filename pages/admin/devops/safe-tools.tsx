import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import ConfirmationModal from '../../../components/admin/ConfirmationModal';
import styles from './SafeTools.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

export default function SafeToolsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      router.push('/admin');
    }
  }, [session]);

  const tools = [
    { id: 'send-test-email', name: 'Send Test Email', icon: '✉️', risk: 'safe', description: 'Sends a test email to your admin email to verify email service is working.', confirmationType: 'low' as const, endpoint: '/api/admin/devops/safe-tools/send-test-email' },
    { id: 'clear-cache', name: 'Clear Page Cache', icon: '🗑️', risk: 'medium', description: 'Clears Next.js ISR cache for all pages. Site may be slower until cache rebuilds.', confirmationType: 'medium' as const, endpoint: '/api/admin/devops/cache/clear' },
  ];

  const handleToolClick = (tool: typeof tools[0]) => {
    if (tool.risk === 'safe') {
      // Run safe tools immediately
      runTool(tool.id);
    } else {
      // Show confirmation for non-safe tools
      setSelectedTool(tool);
      setShowModal(true);
    }
  };

  const runTool = async (toolId: string) => {
    setProcessing(toolId);
    const tool = tools.find(t => t.id === toolId);
    const endpoint = tool?.endpoint || '/api/admin/devops/safe-tools/run';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✓ ${data.message}`);
      } else {
        const error = await res.json();
        alert(`✗ ${error.error || 'Tool execution failed'}`);
      }
    } catch (error) {
      alert('✗ Tool execution failed');
    } finally {
      setProcessing(null);
      setShowModal(false);
      setSelectedTool(null);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'safe': return '#10b981';
      case 'low': return '#3b82f6';
      case 'medium': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Safe Tools</h1>
            <p className={styles.subtitle}>System maintenance and diagnostic tools</p>
          </div>
        </div>

        <div className={styles.toolsGrid}>
          {tools.map((tool) => (
            <div key={tool.id} className={styles.toolCard}>
              <div className={styles.toolIcon}>{tool.icon}</div>
              <h3 className={styles.toolName}>{tool.name}</h3>
              <p className={styles.toolDescription}>{tool.description}</p>
              <div className={styles.toolFooter}>
                <span
                  className={styles.riskBadge}
                  style={{ backgroundColor: getRiskColor(tool.risk) }}
                >
                  {tool.risk === 'safe' ? '✓ Safe' : tool.risk === 'low' ? 'Low Risk' : 'Medium Risk'}
                </span>
                <button
                  className={`${styles.runButton} ${tool.risk === 'safe' ? styles.safe : tool.risk === 'medium' ? styles.caution : styles.default}`}
                  onClick={() => handleToolClick(tool)}
                  disabled={processing !== null}
                >
                  {processing === tool.id ? '⟳ Running...' : '▶ Run'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedTool(null); }}
        onConfirm={() => selectedTool && runTool(selectedTool.id)}
        title={`Run ${selectedTool?.name}`}
        message={selectedTool?.description || ''}
        confirmText="Run Tool"
        confirmationType={selectedTool?.confirmationType}
        actionType={selectedTool?.risk === 'medium' ? 'caution' : 'safe'}
      />
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
