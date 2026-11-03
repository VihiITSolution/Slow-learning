import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Avatar from '../components/common/Avatar';
import { PageHeader, Section, RoleBadge, LoadState, S, apiError, timeAgo } from '../components/admin/AdminUI';

const FILTERS = [['', 'All'], ['student', 'Students'], ['teacher', 'Teachers'], ['admin', 'Admins']];

/** Every account with its learning activity (read-only). */
export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (e) {
      setError(apiError(e, 'Could not load users.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }), {}), [users]);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => (!role || u.role === role)
      && (!term || u.username.toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)));
  }, [users, role, search]);

  return (
    <div style={S.page}>
      <PageHeader
        icon="👥"
        title="User Management"
        subtitle="Everyone with a LearnQuest account and what they have been doing."
        actions={<button type="button" onClick={load} style={S.secondaryBtn}>🔄 Refresh</button>}
      />

      <LoadState loading={loading} error={error} onRetry={load}>
        <Section
          title={`${shown.length} of ${users.length} users`}
          actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div role="tablist" aria-label="Filter by role" style={{ display: 'flex', gap: 6 }}>
                {FILTERS.map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={role === value}
                    onClick={() => setRole(value)}
                    style={{
                      ...S.secondaryBtn, padding: '6px 12px', fontSize: 13,
                      borderColor: role === value ? '#6366f1' : '#e2e8f0',
                      background: role === value ? '#eef2ff' : '#fff',
                      color: role === value ? '#4338ca' : '#64748b',
                    }}
                  >
                    {label} ({value ? counts[value] || 0 : users.length})
                  </button>
                ))}
              </div>
              <input
                type="search"
                aria-label="Search users"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={S.input}
              />
            </div>
          }
        >
          {shown.length === 0 ? (
            <p style={{ ...S.muted, textAlign: 'center', padding: 24 }}>No users match this filter.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Users">
                <thead>
                  <tr>
                    <th style={S.th}>User</th>
                    <th style={S.th}>Role</th>
                    <th style={S.th}>Level / XP</th>
                    <th style={S.th}>Lessons</th>
                    <th style={S.th}>Quizzes</th>
                    <th style={S.th}>Last active</th>
                    <th style={S.th}>Joined</th>
                    <th style={S.th}><span style={{ position: 'absolute', left: -9999 }}>Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u.id}>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar user={u} size={34} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.username}</div>
                            <div style={S.muted}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={S.td}><RoleBadge role={u.role} /></td>
                      <td style={S.td}>{u.role === 'student' ? `Level ${u.level} · ${u.total_xp} XP` : '—'}</td>
                      <td style={S.td}>{u.role === 'student' ? u.lessons_completed : '—'}</td>
                      <td style={S.td}>{u.role === 'student' ? u.quiz_attempts : '—'}</td>
                      <td style={S.td}>{timeAgo(u.last_login)}</td>
                      <td style={S.td}>{timeAgo(u.created_at)}</td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                        {u.role === 'student' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            <Link to={`/student-dashboard?name=${encodeURIComponent(u.username)}`} style={{ ...S.secondaryBtn, padding: '5px 10px', fontSize: 12 }}>
                              Game results
                            </Link>
                            <Link to={`/teacher/support-plans?studentId=${u.id}`} style={{ ...S.secondaryBtn, padding: '5px 10px', fontSize: 12 }}>
                              Support plan
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ ...S.muted, marginTop: 12 }}>
            Students and teachers create their own accounts on the sign-up page.
          </p>
        </Section>
      </LoadState>
    </div>
  );
}
