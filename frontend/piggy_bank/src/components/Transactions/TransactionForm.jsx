import { useState, useEffect } from "react"
import { apiGet } from "../../utils/Client"

const TRANSACTION_TYPES = ['income', 'expense', 'transfer']
// Values must match the backend CHECK constraint
// (cash | mpesa | card | bank_transfer) or inserts fail at the DB.
const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
]
const STATUSES = ['pending', 'completed', 'failed']

const toDateInput = (value) => {
    if (!value) return new Date().toISOString().split('T')[0]
    return new Date(value).toISOString().split('T')[0]
}

const TransactionForm = ({ transaction, onSubmit, onCancel, isSubmitting }) => {
    const isEditing = Boolean(transaction)

    const [type, setType] = useState(transaction?.type || 'expense')
    const [accountId, setAccountId] = useState(transaction?.account_id || '')
    const [fromAccountId, setFromAccountId] = useState(transaction?.from_account_id || '')
    const [toAccountId, setToAccountId] = useState(transaction?.to_account_id || '')
    const [categoryId, setCategoryId] = useState(transaction?.category_id || '')
    const [amount, setAmount] = useState(transaction?.amount ?? '')
    const [description, setDescription] = useState(transaction?.description || '')
    const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method || 'cash')
    const [referenceId, setReferenceId] = useState(transaction?.reference_id || '')
    const [status, setStatus] = useState(transaction?.status || 'completed')
    const [transactionDate, setTransactionDate] = useState(toDateInput(transaction?.transaction_date))

    const [accounts, setAccounts] = useState([])
    const [categories, setCategories] = useState([])
    const [isLoadingOptions, setIsLoadingOptions] = useState(true)
    const [optionsError, setOptionsError] = useState(null)

    useEffect(() => {
        let ignore = false

        async function loadOptions() {
            setIsLoadingOptions(true)
            setOptionsError(null)
            try {
                const [accountsData, categoriesData] = await Promise.all([
                    apiGet("/accounts"),
                    apiGet("/categories"),
                ])
                if (!ignore) {
                    setAccounts(accountsData || [])
                    setCategories(categoriesData || [])
                }
            } catch (err) {
                if (!ignore) setOptionsError(err.message)
            } finally {
                if (!ignore) setIsLoadingOptions(false)
            }
        }

        loadOptions()

        return () => {
            ignore = true
        }
    }, [])

    const isTransfer = type === 'transfer'
    // Only show categories matching the selected transaction type
    const filteredCategories = categories.filter((c) => c.type === type)

    const handleSubmit = (e) => {
        e.preventDefault()

        const payload = {
            amount: Number(amount),
            type,
            description,
            status,
            transaction_date: new Date(transactionDate).toISOString(),
        }
        if (paymentMethod) payload.payment_method = paymentMethod
        if (referenceId) payload.reference_id = referenceId

        if (isTransfer) {
            payload.from_account_id = fromAccountId
            payload.to_account_id = toAccountId
        } else {
            payload.account_id = accountId
            if (categoryId) payload.category_id = categoryId
        }

        onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    {isEditing ? 'Edit Transaction' : 'Add New Transaction'}
                </h2>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {optionsError && (
                <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                    Couldn't load accounts/categories: {optionsError}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                    </label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value)
                            setCategoryId('')
                        }}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {TRANSACTION_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                    </label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {isTransfer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fromAccountId" className="block text-sm font-medium text-gray-700 mb-1">
                            From Account
                        </label>
                        <select
                            id="fromAccountId"
                            value={fromAccountId}
                            onChange={(e) => setFromAccountId(e.target.value)}
                            required
                            disabled={isLoadingOptions}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                            <option value="" disabled>Select source</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} {account.currency ? `(${account.currency})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700 mb-1">
                            To Account
                        </label>
                        <select
                            id="toAccountId"
                            value={toAccountId}
                            onChange={(e) => setToAccountId(e.target.value)}
                            required
                            disabled={isLoadingOptions}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                            <option value="" disabled>Select destination</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} {account.currency ? `(${account.currency})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                            Account
                        </label>
                        <select
                            id="accountId"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            required
                            disabled={isLoadingOptions}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                            <option value="" disabled>Select an account</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} {account.currency ? `(${account.currency})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                            Category (Optional)
                        </label>
                        <select
                            id="categoryId"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={isLoadingOptions}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                            <option value="">No category</option>
                            {filteredCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.icon ? `${category.icon} ` : ''}{category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Transaction description"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                    </label>
                    <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {PAYMENT_METHODS.map((method) => (
                            <option key={method.value} value={method.value}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="referenceId" className="block text-sm font-medium text-gray-700 mb-1">
                        Reference ID (Optional)
                    </label>
                    <input
                        type="text"
                        id="referenceId"
                        value={referenceId}
                        onChange={(e) => setReferenceId(e.target.value)}
                        placeholder="Reference or transaction ID"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Date
                    </label>
                    <input
                        type="date"
                        id="transactionDate"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
                </button>
                <button 
                    type="button" 
                    onClick={onCancel} 
                    disabled={isSubmitting} 
                    className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default TransactionForm
