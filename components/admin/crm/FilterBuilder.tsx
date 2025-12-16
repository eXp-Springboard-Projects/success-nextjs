import { useState } from 'react';
import styles from './FilterBuilder.module.css';

interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface Filters {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

interface FilterBuilderProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const FIELD_OPTIONS = [
  { value: 'status', label: 'Email Status' },
  { value: 'tags', label: 'Tags' },
  { value: 'source', label: 'Source' },
  { value: 'emailEngagementScore', label: 'Engagement Score' },
  { value: 'lastContactedAt', label: 'Last Contacted' },
  { value: 'createdAt', label: 'Created Date' },
];

const OPERATOR_OPTIONS: { [key: string]: { value: string; label: string }[] } = {
  status: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'not equals' },
  ],
  tags: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  source: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  emailEngagementScore: [
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
    { value: 'equals', label: 'equals' },
  ],
  lastContactedAt: [
    { value: 'in_last_days', label: 'in last X days' },
    { value: 'not_in_last_days', label: 'not in last X days' },
    { value: 'is_empty', label: 'never contacted' },
    { value: 'is_not_empty', label: 'has been contacted' },
  ],
  createdAt: [
    { value: 'in_last_days', label: 'in last X days' },
    { value: 'not_in_last_days', label: 'not in last X days' },
    { value: 'before_date', label: 'before date' },
    { value: 'after_date', label: 'after date' },
  ],
};

export default function FilterBuilder({ filters, onChange }: FilterBuilderProps) {
  const addCondition = () => {
    onChange({
      ...filters,
      conditions: [
        ...filters.conditions,
        { field: 'status', operator: 'equals', value: '' },
      ],
    });
  };

  const removeCondition = (index: number) => {
    onChange({
      ...filters,
      conditions: filters.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const newConditions = [...filters.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange({ ...filters, conditions: newConditions });
  };

  const toggleLogic = () => {
    onChange({ ...filters, logic: filters.logic === 'AND' ? 'OR' : 'AND' });
  };

  const needsValue = (operator: string) => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  return (
    <div className={styles.filterBuilder}>
      {/* Logic Selector */}
      {filters.conditions.length > 1 && (
        <div className={styles.logicSelector}>
          <span className={styles.logicLabel}>Match contacts that meet</span>
          <button onClick={toggleLogic} className={styles.logicButton}>
            {filters.logic === 'AND' ? 'ALL' : 'ANY'}
          </button>
          <span className={styles.logicLabel}>of the following conditions:</span>
        </div>
      )}

      {/* Conditions */}
      <div className={styles.conditions}>
        {filters.conditions.map((condition, index) => (
          <div key={index} className={styles.condition}>
            <div className={styles.conditionRow}>
              {/* Field */}
              <select
                value={condition.field}
                onChange={(e) => {
                  const newField = e.target.value;
                  const newOperator = OPERATOR_OPTIONS[newField]?.[0]?.value || 'equals';
                  updateCondition(index, { field: newField, operator: newOperator, value: '' });
                }}
                className={styles.conditionSelect}
              >
                {FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Operator */}
              <select
                value={condition.operator}
                onChange={(e) => updateCondition(index, { operator: e.target.value })}
                className={styles.conditionSelect}
              >
                {OPERATOR_OPTIONS[condition.field]?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Value */}
              {needsValue(condition.operator) && (
                <input
                  type={
                    condition.field === 'emailEngagementScore'
                      ? 'number'
                      : condition.operator.includes('date')
                      ? 'date'
                      : 'text'
                  }
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder={
                    condition.operator.includes('days')
                      ? 'Number of days'
                      : condition.field === 'tags'
                      ? 'Tag name'
                      : 'Value'
                  }
                  className={styles.conditionInput}
                />
              )}

              {/* Remove Button */}
              <button
                onClick={() => removeCondition(index)}
                className={styles.removeButton}
                title="Remove condition"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Condition Button */}
      <button onClick={addCondition} className={styles.addButton}>
        + Add Condition
      </button>

      {filters.conditions.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <div className={styles.emptyText}>No filter conditions yet</div>
          <div className={styles.emptySubtext}>Click "Add Condition" to start building your segment</div>
        </div>
      )}
    </div>
  );
}
