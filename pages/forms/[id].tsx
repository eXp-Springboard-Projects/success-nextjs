import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Field {
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export default function PublicForm() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (id) {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/admin/crm/forms/${id}`);
      const data = await res.json();

      if (data.status !== 'active') {
        setForm({ error: 'This form is not active' });
        return;
      }

      setForm(data);

      // Initialize form data
      const initialData: any = {};
      (data.fields || []).forEach((field: Field) => {
        initialData[field.name] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching form:', error);
      setForm({ error: 'Failed to load form' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: any = {};
    (form.fields || []).forEach((field: Field) => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Invalid email address';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);

        // Redirect if configured
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        alert(data.error || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const renderField = (field: Field) => {
    const error = errors[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${error ? '#dc3545' : '#ddd'}`,
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '100px',
            }}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${error ? '#dc3545' : '#ddd'}`,
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          >
            <option value="">Select...</option>
            {field.options?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div>
            {field.options?.map((option, i) => (
              <label key={i} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={formData[field.name] === option}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  style={{ marginRight: '0.5rem' }}
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div>
            {field.options?.map((option, i) => (
              <label key={i} style={{ display: 'block', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name={`${field.name}[]`}
                  value={option}
                  checked={(formData[field.name] || []).includes(option)}
                  onChange={(e) => {
                    const current = formData[field.name] || [];
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter((v: string) => v !== option);
                    handleChange(field.name, updated);
                  }}
                  style={{ marginRight: '0.5rem' }}
                />
                {option}
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${error ? '#dc3545' : '#ddd'}`,
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          />
        );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        Loading...
      </div>
    );
  }

  if (form?.error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <p>{form.error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '2rem auto',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
      }}>
        <Head>
          <title>{form.name} - Thank You</title>
        </Head>
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>Thank You!</h2>
          <p style={{ margin: 0 }}>
            {form.thankYouMessage || 'Your submission has been received.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <Head>
        <title>{form.name}</title>
      </Head>

      <h1 style={{ marginBottom: '1.5rem' }}>{form.name}</h1>

      <form onSubmit={handleSubmit}>
        {(form.fields || []).map((field: Field) => (
          <div key={field.id} style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor={field.name}
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              {field.label}
              {field.required && <span style={{ color: '#dc3545' }}> *</span>}
            </label>
            {renderField(field)}
            {errors[field.name] && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {errors[field.name]}
              </div>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '1rem',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
