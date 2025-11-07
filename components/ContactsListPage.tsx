

import React, { useState, useEffect, useCallback } from 'react';
import { User, Contact } from '../types';
import { CloseIcon } from './icons';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ children, title, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-modal-open" onClick={onClose}>
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"><CloseIcon /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const ContactsListPage: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState<Partial<Contact> | null>(null);

    const fetchContacts = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/contacts', { headers: { 'x-user-id': currentUser.id } });
            if (res.ok) {
                const data = await res.json();
                setContacts(data);
            }
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser.id]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const openModal = (contact: Partial<Contact> | null = null) => {
        setCurrentContact(contact || { name: '', email: '', phone: '', notes: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsDeleteConfirmOpen(false);
        setCurrentContact(null);
    };

    const openDeleteConfirm = (contact: Contact) => {
        setCurrentContact(contact);
        setIsDeleteConfirmOpen(true);
    };
    
    const handleSave = async () => {
        if (!currentContact || !currentContact.name) return;
        const method = currentContact.id ? 'PUT' : 'POST';
        const url = currentContact.id ? `/api/contacts?id=${currentContact.id}` : '/api/contacts';
        
        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
                body: JSON.stringify(currentContact)
            });
            closeModal();
            fetchContacts();
        } catch (error) {
            console.error("Failed to save contact:", error);
        }
    };
    
    const handleDelete = async () => {
        if (!currentContact || !currentContact.id) return;
        try {
            await fetch(`/api/contacts?id=${currentContact.id}`, { 
                method: 'DELETE',
                headers: { 'x-user-id': currentUser.id }
            });
            closeModal();
            fetchContacts();
        } catch (error) {
            console.error("Failed to delete contact:", error);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-white/70 dark:bg-black/30 p-8 rounded-xl shadow-2xl border-2 border-purple-500/50 backdrop-blur-sm text-gray-800 dark:text-white">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-bold">Contacts</h2>
                <button onClick={() => openModal()} className="px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 transform bg-blue-600 hover:bg-blue-700 hover:scale-105">
                    Add New Contact
                </button>
            </div>

            {isLoading ? <p className="text-center">Loading contacts...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.length === 0 && <p className="text-center md:col-span-2 lg:col-span-3 text-gray-500 dark:text-gray-400">You have no contacts yet.</p>}
                    {contacts.map(contact => (
                        <div key={contact.id} className="bg-gray-100/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-md flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold">{contact.name}</h3>
                                {contact.email && <p className="text-sm text-gray-600 dark:text-gray-300">{contact.email}</p>}
                                {contact.phone && <p className="text-sm text-gray-600 dark:text-gray-300">{contact.phone}</p>}
                                {contact.notes && <p className="text-xs mt-2 italic text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{contact.notes}</p>}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => openModal(contact)} className="px-3 py-1 bg-blue-600/50 hover:bg-blue-600 rounded text-sm transition text-white">Edit</button>
                                <button onClick={() => openDeleteConfirm(contact)} className="px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded text-sm transition text-white">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && currentContact && (
                <Modal title={currentContact.id ? 'Edit Contact' : 'Add Contact'} onClose={closeModal}>
                    <div className="space-y-4">
                        <input type="text" placeholder="Name (Required)" value={currentContact.name || ''} onChange={e => setCurrentContact({...currentContact, name: e.target.value})} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-800 dark:text-white" />
                        <input type="email" placeholder="Email" value={currentContact.email || ''} onChange={e => setCurrentContact({...currentContact, email: e.target.value})} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-800 dark:text-white" />
                        <input type="tel" placeholder="Phone" value={currentContact.phone || ''} onChange={e => setCurrentContact({...currentContact, phone: e.target.value})} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-800 dark:text-white" />
                        <textarea placeholder="Notes" value={currentContact.notes || ''} onChange={e => setCurrentContact({...currentContact, notes: e.target.value})} className="w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-800 dark:text-white resize-none" rows={3}></textarea>
                    </div>
                     <div className="pt-6 flex justify-end gap-3">
                        <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                    </div>
                </Modal>
            )}

            {isDeleteConfirmOpen && currentContact && (
                 <Modal title={`Delete ${currentContact.name}?`} onClose={closeModal}>
                    <p className="text-gray-800 dark:text-white">Are you sure you want to delete this contact? This action cannot be undone.</p>
                    <div className="pt-6 flex justify-end gap-3">
                        <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ContactsListPage;
