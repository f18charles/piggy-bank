import { useState, useEffect, useCallback } from "react"
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/Client"
import TransactionRow from "../components/Transactions/TransactionRow"
import TransactionForm from "../components/Transactions/TransactionForm"

const Transactions = () => {
    const [transactions, setTransactions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [actionError, setActionError] = useState(null)

    // Filter state
    const [filterType, setFilterType] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const loadTransactions = useCallback(async () => {
        try {
            const data = await apiGet("/transactions")
            // Sort transactions by created_at in descending order (latest first)
            const sortedData = data.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.created_at)
                const dateB = new Date(b.createdAt || b.created_at)
                return dateB - dateA
            })
            setTransactions(sortedData)
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
                const data = await apiGet("/transactions")
                if (!ignore) {
                    // Sort transactions by created_at in descending order (latest first)
                    const sortedData = data.sort((a, b) => {
                        const dateA = new Date(a.createdAt || a.created_at)
                        const dateB = new Date(b.createdAt || b.created_at)
                        return dateB - dateA
                    })
                    setTransactions(sortedData)
                }
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
        setEditingTransaction(null)
        setActionError(null)
        setIsFormOpen(true)
    }

    const openEditForm = (transaction) => {
        setEditingTransaction(transaction)
        setActionError(null)
        setIsFormOpen(true)
    }

    const closeForm = () => {
        setIsFormOpen(false)
        setEditingTransaction(null)
    }

    const handleSubmit = async (payload) => {
        setIsSubmitting(true)
        setActionError(null)
        try {
            if (editingTransaction) {
                await apiPatch(`/transactions/${editingTransaction.id}`, { 
                    description: payload.description 
                })
            } else {
                await apiPost("/transactions", payload)
            }
            closeForm()
            await loadTransactions()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (transaction) => {
        if (!window.confirm(`Delete transaction "${transaction.description}"? This can't be undone.`)) {
            return
        }
        setDeletingId(transaction.id)
        setActionError(null)
        try {
            await apiDelete(`/transactions/${transaction.id}`)
            await loadTransactions()
        } catch (err) {
            setActionError(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    // Filter transactions
    const filteredTransactions = transactions.filter(tx => {
        // Type filter
        if (filterType !== 'all' && tx.type !== filterType) return false
        
        // Status filter
        if (filterStatus !== 'all' && tx.status !== filterStatus) return false
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return tx.description?.toLowerCase().includes(query) ||
                   tx.reference_id?.toLowerCase().includes(query) ||
                   tx.payment_method?.toLowerCase().includes(query)
        }
        
        return true
    })

    // Calculate summary statistics
    const getSummaryStats = () => {
        if (transactions.length === 0) return null
        
        const totalIncome = transactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + Number(tx.amount), 0)
        
        const totalExpenses = transactions
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + Number(tx.amount), 0)
        
        const netBalance = totalIncome - totalExpenses
        const pendingCount = transactions.filter(tx => tx.status === 'pending').length
        
        return {
            totalIncome,
            totalExpenses,
            netBalance,
            pendingCount,
            totalCount: transactions.length
        }
    }

    const stats = getSummaryStats()

    return (
        <div className="p-3 sm:p-4 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Transactions</h1>
                    {stats && (
                        <p className="text-sm text-gray-500 mt-1">
                            {stats.totalCount} {stats.totalCount === 1 ? 'transaction' : 'transactions'} • 
                            {stats.pendingCount} pending
                        </p>
                    )}
                </div>
                <button
                    onClick={openCreateForm}
                    className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Transaction
                </button>
            </div>

            {/* Summary Cards */}
            {stats && !isLoading && !error && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Total Income</p>
                        <p className="text-xl font-bold text-emerald-600">
                            ${stats.totalIncome.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Total Expenses</p>
                        <p className="text-xl font-bold text-rose-600">
                            ${stats.totalExpenses.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Net Balance</p>
                        <p className={`text-xl font-bold ${stats.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${stats.netBalance.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Pending</p>
                        <p className="text-xl font-bold text-yellow-600">
                            {stats.pendingCount}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
                <div className="w-full sm:flex-1 sm:min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="flex-1 sm:flex-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 sm:flex-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
                {(filterType !== 'all' || filterStatus !== 'all' || searchQuery) && (
                    <button
                        onClick={() => {
                            setFilterType('all')
                            setFilterStatus('all')
                            setSearchQuery('')
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                    >
                        Clear Filters
                    </button>
                )}
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
                        <div 
                            className="fixed inset-0 bg-black opacity-50 transition-opacity"
                            onClick={closeForm}
                        />
                        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto">
                            <TransactionForm
                                transaction={editingTransaction}
                                onSubmit={handleSubmit}
                                onCancel={closeForm}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Table Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : error ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                    <p className="text-rose-600">Couldn't load transactions: {error}</p>
                    <button 
                        onClick={loadTransactions}
                        className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        Try again
                    </button>
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                    <div className="text-gray-400 mb-3">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">
                        {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {transactions.length === 0 
                            ? 'Add your first transaction to start tracking your finances'
                            : 'Try adjusting your filters or search query'}
                    </p>
                    {transactions.length === 0 && (
                        <button
                            onClick={openCreateForm}
                            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                        >
                            Add Transaction
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Table Header - desktop/tablet only, mobile uses cards inside TransactionRow */}
                    <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Payment Method</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                        {filteredTransactions.map((transaction) => (
                            <TransactionRow
                                key={transaction.id}
                                transaction={transaction}
                                onEdit={openEditForm}
                                onDelete={handleDelete}
                                isDeleting={deletingId === transaction.id}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transactions