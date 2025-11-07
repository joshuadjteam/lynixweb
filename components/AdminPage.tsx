

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { CloseIcon } from './icons';

// Moved Modal component outside of AdminPage to prevent re-creation on each render,
// which fixes the input focus loss issue.
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ children, title, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-modal-open">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><CloseIcon /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
        <span className="font-medium text-gray-800 dark:text-white">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'
            }`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    </div>
);


const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [password, setPassword] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            const data = await response.json();
            setUsers(data);
        } else {
            console.error('Failed to fetch users');
            setUsers([]);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentUser(null);
    setFormData({
        username: '',
        email: '',
        sip: '',
        role: 'standard',
        plan: { name: '', cost: '', details: '' },
        billing: { status: 'On Time', owes: 0 },
        chat_enabled: false,
        ai_enabled: false,
        localmail_enabled: false,
    });
    setPassword('');
    setIsModalOpen(true);
  };
  
  const openEditModal = (user: User) => {
    setModalMode('edit');
    setCurrentUser(user);
    // Deep copy and ensure all keys exist
    const userCopy = JSON.parse(JSON.stringify(user));
    userCopy.localmail_enabled = userCopy.localmail_enabled || false;
    setFormData(userCopy);
    setPassword('');
    setIsModalOpen(true);
  };
  
  const openDeleteConfirm = (user: User) => {
    setCurrentUser(user);
    setIsDeleteConfirmOpen(true);
  }
  
  const closeModal = () => {
    setIsModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setCurrentUser(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name: 'chat_enabled' | 'ai_enabled' | 'localmail_enabled', value: boolean) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    setFormData((prev: any) => ({
        ...prev,
        [parent]: {
            ...prev[parent],
            [child]: value,
        }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newUserPayload = {
        userData: {
            username: formData.username,
            email: formData.email,
            sip: formData.sip,
            role: formData.role,
            plan: {
                name: formData.plan.name,
                cost: formData.plan.cost,
                details: formData.plan.details,
            },
            billing: {
                status: formData.billing.status,
                owes: Number(formData.billing.owes) || 0,
            },
            chat_enabled: formData.chat_enabled,
            ai_enabled: formData.ai_enabled,
            localmail_enabled: formData.localmail_enabled,
        },
        password: password
      };
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserPayload),
      });
    } else if (currentUser) {
      await fetch(`/api/users?id=${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
      });
      if(password.trim() !== ''){
        await fetch(`/api/users?id=${currentUser.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
      }
    }
    fetchUsers();
    closeModal();
  };
  
  const handleDelete = async () => {
    if (currentUser) {
      await fetch(`/api/users?id=${currentUser.id}`, { method: 'DELETE' });
      fetchUsers();
      closeModal();
    }
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto bg-white/70 dark:bg-black/30 p-8 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm text-gray-800 dark:text-white">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold">Admin Portal</h2>
        <button onClick={openAddModal} className="px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 transform bg-blue-600 hover:bg-blue-700 hover:scale-105">
            Add New User
        </button>
      </div>
      
      {isLoading ? <div className="text-center py-8">Loading users from database...</div> : (
      <div className="overflow-x-auto bg-gray-100/50 dark:bg-gray-800/50 rounded-lg">
        <table className="min-w-full text-left text-sm font-light">
          <thead className="border-b border-gray-300 dark:border-gray-600 font-medium">
            <tr>
              <th scope="col" className="px-6 py-4">Username</th>
              <th scope="col" className="px-6 py-4">Role</th>
              <th scope="col" className="px-6 py-4">Chat</th>
              <th scope="col" className="px-6 py-4">AI</th>
              <th scope="col" className="px-6 py-4">LocalMail</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition">
                <td className="whitespace-nowrap px-6 py-4 font-medium">{user.username}</td>
                <td className="whitespace-nowrap px-6 py-4 capitalize">{user.role}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.chat_enabled ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-gray-500/20 text-gray-700 dark:bg-gray-600/50 dark:text-gray-400'}`}>
                    {user.chat_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.ai_enabled ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-gray-500/20 text-gray-700 dark:bg-gray-600/50 dark:text-gray-400'}`}>
                    {user.ai_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                 <td className="whitespace-nowrap px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.localmail_enabled ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-gray-500/20 text-gray-700 dark:bg-gray-600/50 dark:text-gray-400'}`}>
                    {user.localmail_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditModal(user)} className="px-3 py-1 bg-blue-600/50 hover:bg-blue-600 rounded text-sm transition text-white">Edit</button>
                  <button onClick={() => openDeleteConfirm(user)} className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded text-sm transition text-white">Delete</button>
                </td>
              </tr>
            ))}
             {users.length === 0 && !isLoading && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No users found in the database.</td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
      )}

      {isModalOpen && formData.plan && formData.billing && (
        <Modal title={modalMode === 'add' ? 'Add New User' : `Edit ${currentUser?.username}`} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-gray-800 dark:text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                  <option value="standard">Standard</option>
                  <option value="trial">Trial</option>
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Password ({modalMode === 'edit' ? 'leave blank to keep current' : 'required'})</label>
              <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required={modalMode === 'add'} className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">SIP</label>
                    <input type="text" name="sip" value={formData.sip} onChange={handleInputChange} className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                </div>
            </div>
            <h4 className="text-lg font-semibold pt-4 border-t border-gray-200 dark:border-gray-600">Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Toggle label="Enable Chat" enabled={formData.chat_enabled} onChange={(val) => handleToggleChange('chat_enabled', val)} />
                <Toggle label="Enable AI" enabled={formData.ai_enabled} onChange={(val) => handleToggleChange('ai_enabled', val)} />
                <Toggle label="Enable LocalMail" enabled={formData.localmail_enabled} onChange={(val) => handleToggleChange('localmail_enabled', val)} />
            </div>
            <h4 className="text-lg font-semibold pt-4 border-t border-gray-200 dark:border-gray-600">Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" name="plan.name" placeholder="Name" value={formData.plan.name} onChange={handleNestedInputChange} className="block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
              <input type="text" name="plan.cost" placeholder="Cost" value={formData.plan.cost} onChange={handleNestedInputChange} className="block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
              <input type="text" name="plan.details" placeholder="Details" value={formData.plan.details} onChange={handleNestedInputChange} className="block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 md:col-span-3" />
            </div>
             <h4 className="text-lg font-semibold pt-4 border-t border-gray-200 dark:border-gray-600">Billing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select name="billing.status" value={formData.billing.status} onChange={handleNestedInputChange} className="block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500">
                <option value="On Time">On Time</option>
                <option value="Overdue">Overdue</option>
                <option value="Suspended">Suspended</option>
              </select>
              <input type="number" step="0.01" name="billing.owes" placeholder="Amount Owed" value={formData.billing.owes || 0} onChange={handleNestedInputChange} className="block w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{modalMode === 'add' ? 'Create User' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {isDeleteConfirmOpen && currentUser && (
        <Modal title={`Delete ${currentUser.username}?`} onClose={closeModal}>
          <p>Are you sure you want to delete this user? This action cannot be undone.</p>
          <div className="pt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete User</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPage;
