import React, { useState } from 'react';
import { brandIntelAPI } from '../services/api';

const BrandIntelligence = () => {
  const [form, setForm] = useState({ domainUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await brandIntelAPI.analyze({
        domainUrl: form.domainUrl,
        overrides: {}
      });
      if (data && data.generatedSiteId) {
        const preview = await brandIntelAPI.preview(data.generatedSiteId);
        setResult(preview.data);
      } else {
        setError('Analyze request did not return a generated site id.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Brand Intelligence</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Domain URL</label>
            <input name="domainUrl" value={form.domainUrl} onChange={onChange} placeholder="https://example.com" className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Analyzing…' : 'Analyze Website & Generate Redesign'}</button>
        </form>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {result && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Preview</h2>
            <iframe
              title="brand-preview"
              className="w-full h-[70vh] border rounded"
              srcDoc={`<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1'>
              <link rel='preconnect' href='https://fonts.googleapis.com'>
              <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>
              <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' rel='stylesheet'>
              <style>
                :root{--bg:#ffffff;--text:#1f2937;--muted:#6b7280;--border:#e5e7eb}
                *{box-sizing:border-box}
                html,body{height:100%}
                body{margin:0;font-family:Inter,system-ui,Arial,sans-serif;line-height:1.6;color:var(--text);background:var(--bg)}
                .container{max-width:1100px;margin:0 auto;padding:24px}
                h1{font-size:clamp(1.75rem,2.2vw,2.25rem);margin:0 0 12px}
                h2{font-size:clamp(1.25rem,1.8vw,1.5rem);margin:24px 0 8px}
                p{margin:8px 0;color:var(--text)}
                a.button{display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600}
                img{max-width:100%;height:auto;border-radius:10px}
                .card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:20px;box-shadow:0 4px 14px rgba(0,0,0,.06)}
                .grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
                ${result.css || ''}
              </style></head><body>
              <div class='container brand-root'>${result.html || ''}</div>
              </body></html>`}
            />
          </div>
        )}
    </div>
  );
};

export default BrandIntelligence;


