import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import styles from './Deals.module.css';

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
}

interface Deal {
  id: string;
  name: string;
  company_name: string;
  value: number;
  currency: string;
  stage_id: string;
  stage_name: string;
  stage_color: string;
  probability: number;
  expected_close_date: string;
  owner_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
}

export default function DealsPage() {
  const router = useRouter();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    stage: '',
    owner: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchDeals();
    fetchStages();
  }, [filters]);

  const fetchDeals = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.owner) params.append('owner', filters.owner);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/admin/crm/deals?${params}`);
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/admin/crm/deals/stats');
      const data = await res.json();
      setStages(data.stages || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');

    try {
      await fetch(`/api/admin/crm/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId }),
      });
      fetchDeals();
    } catch (error) {
      console.error('Error updating deal stage:', error);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStageDeals = (stageId: string) => {
    return deals.filter(d => d.stage_id === stageId);
  };

  const getStageValue = (stageId: string) => {
    const stageDeals = getStageDeals(stageId);
    const total = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);
    return formatCurrency(total, 'USD');
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Sales Pipeline">
        <div className={styles.loading}>Loading deals...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Sales Pipeline">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sales Pipeline</h1>
          <div className={styles.actions}>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewButton} ${view === 'kanban' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('kanban')}
              >
                Kanban
              </button>
              <button
                className={`${styles.viewButton} ${view === 'table' ? styles.viewButtonActive : ''}`}
                onClick={() => setView('table')}
              >
                Table
              </button>
            </div>
            <a href="/admin/crm/deals/new" className={styles.addButton}>
              + Add Deal
            </a>
          </div>
        </div>

        {view === 'kanban' ? (
          <div className={styles.kanban}>
            {stages
              .filter(s => s.name !== 'Closed Lost')
              .sort((a, b) => a.order - b.order)
              .map(stage => (
                <div
                  key={stage.id}
                  className={styles.kanbanColumn}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div className={styles.kanbanHeader}>
                    <div className={styles.kanbanTitle}>
                      <span
                        className={styles.stageBadge}
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name} ({getStageDeals(stage.id).length})
                    </div>
                    <div className={styles.kanbanValue}>
                      {getStageValue(stage.id)}
                    </div>
                  </div>
                  <div className={styles.kanbanCards}>
                    {getStageDeals(stage.id).map(deal => (
                      <div
                        key={deal.id}
                        className={styles.dealCard}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onClick={() => router.push(`/admin/crm/deals/${deal.id}`)}
                      >
                        <div className={styles.dealName}>{deal.name}</div>
                        {deal.company_name && (
                          <div className={styles.dealCompany}>{deal.company_name}</div>
                        )}
                        <div className={styles.dealValue}>
                          {formatCurrency(Number(deal.value), deal.currency)}
                        </div>
                        <div className={styles.dealMeta}>
                          <span>{deal.owner_name || 'Unassigned'}</span>
                          <span>{formatDate(deal.expected_close_date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Value</th>
                  <th>Stage</th>
                  <th>Owner</th>
                  <th>Expected Close</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(deal => (
                  <tr
                    key={deal.id}
                    onClick={() => router.push(`/admin/crm/deals/${deal.id}`)}
                  >
                    <td>
                      <strong>{deal.name}</strong>
                      {deal.company_name && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {deal.company_name}
                        </div>
                      )}
                    </td>
                    <td>
                      {deal.contact_first_name || deal.contact_last_name
                        ? `${deal.contact_first_name} ${deal.contact_last_name}`
                        : deal.contact_email || '-'}
                    </td>
                    <td className={styles.valueCell}>
                      {formatCurrency(Number(deal.value), deal.currency)}
                    </td>
                    <td>
                      <span
                        className={styles.stageBadgeTable}
                        style={{
                          backgroundColor: `${deal.stage_color}20`,
                          color: deal.stage_color,
                        }}
                      >
                        <span
                          className={styles.stageDot}
                          style={{ backgroundColor: deal.stage_color }}
                        />
                        {deal.stage_name}
                      </span>
                    </td>
                    <td>{deal.owner_name || 'Unassigned'}</td>
                    <td>{formatDate(deal.expected_close_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deals.length === 0 && (
              <div className={styles.empty}>
                No deals found. Click "Add Deal" to create your first deal.
              </div>
            )}
          </div>
        )}
      </div>
    </DepartmentLayout>
  );
}
