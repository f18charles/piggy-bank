import { useCallback, useEffect, useState } from "react";
import { ApiGet } from "../utils/Client";
import AccountForm from "../components/Accounts/AccountForm";
import AccountRow from "../components/Accounts/AccountRow";

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [actionError, setActionError] = useState(null);

    const fetchAccounts = useCallback(async () => {
        try {
            const data = await ApiGet("/accounts")
            setAccounts(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        let ignore = false

        const initialFetch = async () => {
            try {
                const data = await ApiGet("/accounts")
                if (!ignore) {
                    setAccounts(data)
                    setError(null)
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        initialFetch()

        return () => {
            ignore = true
        }
    }, [])

    const openCreateForm = () => {
        setEditingAccount(null)
        setIsFormOpen(true)
        setActionError(null)
    }

    const openEditForm = (account) => {
        setEditingAccount(account)
        setIsFormOpen(true)
        setActionError(null)
    }

    const closeForm = () => {
        setIsFormOpen(false)
        setEditingAccount(null)
    }

    const handleSubmit = async (payload) => {
        setIsSubmitting(true)
        setActionError(null)
        try {
            if (editingAccount) {
                // Update account
                await ApiPut(`/accounts/${editingAccount.id}`, payload)
            } else {
                // Create new account
                await ApiPost("/accounts", payload)
            }
            await fetchAccounts()
            closeForm()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (account) => {
        if (!window.confirm(`Are you sure you want to delete the account "${account.name}"?`)) {
            return
        }
        setDeletingId(account.id)
        setActionError(null)
        try {
            await ApiDelete(`/accounts/${account.id}`)
            await fetchAccounts()
        } catch (err) {
            setActionError(err.message)
        }
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
                <button 
                onClick={openCreateForm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition:colors">Create Account</button>
            </div>
            {actionError && 
                <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-4">{actionError}</p>
            }
            {isFormOpen && (
                <div className="mb-6">
                    <AccountForm
                        account={editingAccount}
                        onSubmit={handleSubmit}
                        onCancel={closeForm}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}
            {isLoading ? (
                <p className="text-sm text-gray-500">Loading accounts...</p>
            ) : error ? (
                <p className="text-sm text-rose-600">Error loading accounts: {error}</p>
            ) : accounts.length === 0 ? (
                <p className="text-sm text-gray-500">No accounts found.</p>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <AccountRow
                            key={account.id}
                            account={account}
                            onEdit={openEditForm}
                            onDelete={handleDelete}
                            isDeleting={deletingId === account.id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Accounts;