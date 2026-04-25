import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Shield, UserCog } from 'lucide-react';
import { api } from '../api/client';
import type { Role, User } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';

const PAGE_SIZE = 8;

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = () => api.users().then(setUsers);
  useEffect(() => {
    load();
  }, []);

  async function saveRole() {
    if (!editing) return;
    await api.setRole(editing.id, editing.role);
    setEditing(null);
    load();
  }

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const haystack = `${user.name} ${user.email} ${user.role}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [users, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const adminCount = useMemo(() => users.filter((user) => user.role === 'ADMIN').length, [users]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <section className="pageSection">
      <div className="pageHero">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>User Management</h1>
          <p className="pageLead">Review users, inspect assigned roles, and change access levels through the same dense workshop patterns used in the reference app.</p>
        </div>
      </div>

      <div className="metricsGrid metricsGrid-four">
        <DashboardKPICard label="Total Users" value={users.length} />
        <DashboardKPICard label="Administrators" value={adminCount} accent="gold" />
        <DashboardKPICard label="Mobi Agents" value={users.length - adminCount} accent="green" />
        <DashboardKPICard label="Access Roles" value={2} />
      </div>

      <section className="surfaceCard">
        <div className="toolbarRow">
          <label className="searchField">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." />
          </label>
        </div>

        <div className="tableWrap">
          <table className="workshopTable">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((user, index) => (
                <tr key={user.id}>
                  <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                  <td>
                    <div className="tablePrimaryBlock">
                      <strong>{user.name}</strong>
                      <span>User ID #{user.id}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`statusPill ${user.role === 'ADMIN' ? 'statusPositive' : 'statusNeutral'}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className="statusPill statusPositive">ACTIVE</span>
                  </td>
                  <td>
                    <div className="actionRow">
                      <button type="button" className="iconButton" aria-label="View user" onClick={() => setSelected(user)}>
                        <Eye size={16} />
                      </button>
                      <button type="button" className="iconButton" aria-label="Edit user role" onClick={() => setEditing(user)}>
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="emptyCell">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="tableFooter">
          <p>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(filtered.length, page * PAGE_SIZE)} of {filtered.length} users
          </p>
          <div className="paginationControls">
            <button type="button" className="iconButton" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft size={16} />
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button type="button" className="iconButton" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <Modal title="User Details" onClose={() => setSelected(null)} onSubmit={(e) => { e.preventDefault(); setSelected(null); }} submitLabel="Close">
          <div className="detailGrid">
            <div className="detailCard">
              <span>Name</span>
              <strong>{selected.name}</strong>
            </div>
            <div className="detailCard">
              <span>Email</span>
              <strong>{selected.email}</strong>
            </div>
            <div className="detailCard">
              <span>Role</span>
              <strong>{selected.role}</strong>
            </div>
            <div className="detailCard">
              <span>Status</span>
              <strong>ACTIVE</strong>
            </div>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal
          title="Update User Role"
          onClose={() => setEditing(null)}
          onSubmit={(e) => {
            e.preventDefault();
            saveRole();
          }}
          submitLabel="Save Role"
          headerTone="accent"
        >
          <div className="detailGrid">
            <div className="detailCard">
              <span>User</span>
              <strong>{editing.name}</strong>
            </div>
            <div className="detailCard">
              <span>Email</span>
              <strong>{editing.email}</strong>
            </div>
          </div>
          <div className="roleChoiceGrid">
            <button type="button" className={`roleCard ${editing.role === 'ADMIN' ? 'roleCardActive' : ''}`} onClick={() => setEditing({ ...editing, role: 'ADMIN' })}>
              <Shield size={18} />
              <div>
                <strong>ADMIN</strong>
                <span>Full management access</span>
              </div>
            </button>
            <button type="button" className={`roleCard ${editing.role === 'MOBI_AGENT' ? 'roleCardActive' : ''}`} onClick={() => setEditing({ ...editing, role: 'MOBI_AGENT' })}>
              <UserCog size={18} />
              <div>
                <strong>MOBI_AGENT</strong>
                <span>Operational workspace access</span>
              </div>
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
