import { useState } from "react"

const TYPES = ['expense', 'income', 'transfer']
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly']
const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
]

const toDateInput = (value) => {
    if (!value) return new Date().toISOString().split('T')[0]
    return new Date(value).toISOString().split('T')[0]
}

const RecurringForm = ({ item, accounts, categories, onSubmit, onCancel, isSubmitting }) => {
    const isEditing = Boolean(item)

    const [type, setType] = useState(item?.type || 'expense')
    const [accountId, setAccountId] = useState(item?.account_id || '')
    const [toAccountId, setToAccountId] = useState(item?.to_account_id || '')
    const [categoryId, setCategoryId] = useState(item?.category_id || '')
    const [amount, setAmount] = useState(item?.amount ?? '')
    const [description, setDescription] = useState(item?.description || '')
    const [paymentMethod, setPaymentMethod] = useState(item?.payment_method || 'cash')
    const [frequency, setFrequency] = useState(item?.frequency || 'monthly')
    const [nextDueDate, setNextDueDate] = useState(toDateInput(item?.next_due_date))
    const [isActive, setIsActive] = useState(item?.is_active ?? true)

    const isTransfer = type === 'transfer'
    const filteredCategories = categories.filter((c) => c.type === type)

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            account_id: accountId,
            amount: Number(amount),
            type,
            description,
            payment_method: paymentMethod,
            frequency,
            next_due_date: new Date(nextDueDate).toISOString(),
            is_active: isActive,
        }
        if (isTransfer) payload.to_account_id = toAccountId
        if (categoryId) payload.category_id = categoryId
        onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        value={type}
                        onChange={(e) => { setType(e.target.value); setCategoryId('') }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {TYPES.map((t) => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                        type="number"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isTransfer ? 'From Account' : 'Account'}
                    </label>
                    <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="" disabled>Select an account</option>
                        {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>
                {isTransfer ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                        <select
                            value={toAccountId}
                            onChange={(e) => setToAccountId(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="" disabled>Select destination</option>
                            {accounts.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">No category</option>
                            {filteredCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Monthly rent"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {FREQUENCIES.map((f) => (
                            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEditing ? 'Next Due Date' : 'First Due Date'}
                    </label>
                    <input
                        type="date"
                        value={nextDueDate}
                        onChange={(e) => setNextDueDate(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {PAYMENT_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Active
                    </label>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Recurring'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-medium rounded-lg py-2 px-3 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default RecurringForm
