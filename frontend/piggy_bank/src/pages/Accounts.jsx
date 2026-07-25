import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/Client"
import AccountForm from "../components/Accounts/AccountForm"
import AccountRow from "../components/Accounts/AccountRow"

const Accounts = () => {
    const [accounts, setAccounts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [actionError, setActionError] = useState(null)

    const loadAccounts = useCallback(async () => {
        try {
            const data = await apiGet("/accounts")
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

        async function initialLoad() {
            try {
                const data = await apiGet("/accounts")
                if (!ignore) setAccounts(data)
            } catch (err) {
                if (!ignore) setError(err.message)
            } finally {
                if (!ignore) setIsLoading(false)
            }
        }

        initialLoad()

        return () => {
            ignore = true
        }
    }, [])

    const openCreateForm = () => {
        setEditingAccount(null)
        setActionError(null)
        setIsFormOpen(true)
    }

    const openEditForm = (account) => {
        setEditingAccount(account)
        setActionError(null)
        setIsFormOpen(true)
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
                await apiPatch(`/accounts/${editingAccount.id}`, payload)
            } else {
                await apiPost("/accounts", payload)
            }
            closeForm()
            await loadAccounts()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (account) => {
        if (!window.confirm(`Delete "${account.name}"? This can't be undone.`)) {
            return
        }
        setDeletingId(account.id)
        setActionError(null)
        try {
            await apiDelete(`/accounts/${account.id}`)
            await loadAccounts()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

    return (
        <div className="p-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
                    {!isLoading && !error && (
                        <p className="text-sm text-gray-500 mt-1">
                            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} • 
                            Total: ${totalBalance.toFixed(0)}
                        </p>
                    )}
                </div>
                <button
                    onClick={openCreateForm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Account
                </button>
            </div>

            {/* Action Error */}
            {actionError && (
                <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                    <span>{actionError}</span>
                    <button 
                        onClick={() => setActionError(null)}
                        className="text-rose-400 hover:text-rose-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
                            onClick={closeForm}
                        />
                        
                        {/* Modal Panel */}
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto">
                            <AccountForm
                                initialAccount={editingAccount}
                                onSubmit={handleSubmit}
                                onCancel={closeForm}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : error ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                    <p className="text-rose-600">Couldn't load accounts: {error}</p>
                    <button 
                        onClick={loadAccounts}
                        className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        Try again
                    </button>
                </div>
            ) : accounts.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                    <div className="text-gray-400 mb-3">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">No accounts yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Create your first account to start managing your finances</p>
                    <button
                        onClick={openCreateForm}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                    >
                        Create Account
                    </button>
                </div>
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

export default Accounts