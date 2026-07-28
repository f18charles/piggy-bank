import { useState } from "react"

const ACCOUNT_TYPES = [
    { value: 'checking', label: 'Checking', icon: '🏦', color: 'blue' },
    { value: 'savings', label: 'Savings', icon: '💰', color: 'emerald' },
    { value: 'investment', label: 'Investment', icon: '📈', color: 'purple' },
    { value: 'credit', label: 'Credit', icon: '💳', color: 'rose' },
    { value: 'mpesa', label: 'M-Pesa', icon: '📱', color: 'orange' }
]

const AccountForm = ({ account, onSubmit, onCancel, isSubmitting }) => {
    const isEditing = Boolean(account)

    const [name, setName] = useState(account?.name || '')
    const [type, setType] = useState(account?.type || ACCOUNT_TYPES[0].value)
    const [balance, setBalance] = useState(account?.balance || 0)

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = isEditing 
         ? { name, balance: Number(balance) }
         : { name, type, balance: Number(balance) }
        onSubmit(payload)
    }

    // const selectedType = ACCOUNT_TYPES.find(t => t.value === type)

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {isEditing ? 'Edit Account' : 'New Account'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {isEditing ? 'Update account details' : 'Add a new account to track'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Name Input */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Account Name
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g., Main Checking, Savings Fund"
                        className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Type Selection (only for new accounts) */}
            {!isEditing && (
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {ACCOUNT_TYPES.map((typeOption) => (
                            <button
                                key={typeOption.value}
                                type="button"
                                onClick={() => setType(typeOption.value)}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${
                                    type === typeOption.value
                                        ? `border-${typeOption.color}-500 bg-${typeOption.color}-50`
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{typeOption.icon}</span>
                                    <span className={`text-sm font-medium ${
                                        type === typeOption.value ? `text-${typeOption.color}-700` : 'text-gray-700'
                                    }`}>
                                        {typeOption.label}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Show current type when editing */}
            {isEditing && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">Account Type</p>
                    <p className="text-sm font-medium text-gray-700 capitalize">{type}</p>
                </div>
            )}

            {/* Balance Input */}
            <div>
                <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Balance
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-medium">$</span>
                    </div>
                    <input
                        type="number"
                        id="balance"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl py-2.5 px-4 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </span>
                    ) : isEditing ? 'Save Changes' : 'Add Account'}
                </button>
                <button 
                    type="button" 
                    onClick={onCancel} 
                    disabled={isSubmitting} 
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-xl py-2.5 px-4 transition-all duration-200"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

export default AccountForm