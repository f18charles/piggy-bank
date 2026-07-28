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

    // Calculate total balance and distribution
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
    
    const typeDistribution = accounts.reduce((acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + Number(account.balance)
        return acc
    }, {})

    const getTypeColor = (type) => {
        const colors = {
            checking: 'bg-blue-500',
            savings: 'bg-emerald-500',
            investment: 'bg-purple-500',
            credit: 'bg-rose-500',
            mpesa: 'bg-orange-500'
        }
        return colors[type] || 'bg-gray-500'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                            Accounts
                        </h1>
                        {!isLoading && !error && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                                {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} • 
                                Total: <span className="font-semibold text-gray-700">${totalBalance.toFixed(0)}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={openCreateForm}
                        className="w-full sm:w-auto justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl px-6 py-3 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:scale-[1.02]"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Account
                    </button>
                </div>

                {/* Distribution Cards */}
                {!isLoading && !error && accounts.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                        {Object.entries(typeDistribution).map(([type, total]) => (
                            <div key={type} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-2 h-2 rounded-full ${getTypeColor(type)}`}></div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{type}</p>
                                </div>
                                <p className="text-sm font-bold text-gray-900">${total.toFixed(0)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Error */}
                {actionError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between animate-slideDown">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-rose-700">{actionError}</span>
                        </div>
                        <button 
                            onClick={() => setActionError(null)}
                            className="text-rose-400 hover:text-rose-600 transition-colors"
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
                            <div 
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                                onClick={closeForm}
                            />
                            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100">
                                <AccountForm
                                    account={editingAccount}
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
                    <div className="flex items-center justify-center py-20">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
                        <svg className="w-12 h-12 text-rose-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-rose-600 font-medium">Couldn't load accounts</p>
                        <p className="text-sm text-rose-500 mt-1">{error}</p>
                        <button 
                            onClick={loadAccounts}
                            className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                            Try again →
                        </button>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                        <div className="text-gray-300 mb-4">
                            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">No accounts yet</h3>
                        <p className="text-sm text-gray-500 mt-2">Create your first account to start managing your finances</p>
                        <button
                            onClick={openCreateForm}
                            className="mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl px-6 py-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 transform hover:scale-[1.02]"
                        >
                            Create Account
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3">
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
        </div>
    )
}

export default Accounts