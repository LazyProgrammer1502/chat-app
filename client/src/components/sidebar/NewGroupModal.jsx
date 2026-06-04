import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { authService } from '../../api/services';
import Avatar from '../ui/Avatar';

export default function NewGroupModal({ onClose }) {
  const { createGroup } = useChat();
  const [name,     setName]     = useState('');
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy,     setBusy]     = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await authService.searchUsers(query.trim());
        setResults(data.users.filter(u => !selected.find(s => s._id === u._id)));
      } catch { setResults([]); }
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [query, selected]);

  const toggle = (u) => {
    setSelected(prev => prev.find(s => s._id === u._id) ? prev.filter(s => s._id !== u._id) : [...prev, u]);
    setQuery('');
    setResults([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || selected.length < 1) return;
    setBusy(true);
    await createGroup(name.trim(), selected.map(u => u._id));
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-5">New group chat</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Group name</label>
            <input type="text" className="input" placeholder="e.g. Project Team"
              value={name} onChange={e => setName(e.target.value)} maxLength={60} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Add members</label>
            <input type="text" className="input" placeholder="Search by name or email…"
              value={query} onChange={e => setQuery(e.target.value)} />
            {results.length > 0 && (
              <div className="mt-1 border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {results.map(u => (
                  <button key={u._id} type="button" onClick={() => toggle(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors">
                    <Avatar user={u} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map(u => (
                <span key={u._id} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                  {u.name}
                  <button type="button" onClick={() => toggle(u)} className="hover:text-blue-900">✕</button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
            <button type="submit" disabled={busy || !name.trim() || selected.length < 1}
              className="btn-primary flex-1 py-2.5">
              {busy ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
