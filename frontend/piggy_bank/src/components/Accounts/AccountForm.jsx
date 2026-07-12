import { useState } from "react"

const ACCOUNT_TYPES = ['checking', 'savings', 'investment', 'credit', 'mpesa']

const AccountForm = ({ account, onSubmit, onCancel, isSubmitting }) => {
    const isEditing = Boolean(account)

    const [name, setName] = useState(account?.name || '')
    const [type, setType] = useState(account?.type || ACCOUNT_TYPES[0])
    const [balance, setBalance] = useState(account?.balance || 0)

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = isEditing 
         ? { name, balance: Number(balance) }
         : { name, type, balance: Number(balance) }
        onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
                {isEditing ? 'Edit Account' : 'Add New Account'}
            </h2>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {!isEditing && (
                    <div className="">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {ACCOUNT_TYPES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="">
                    <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
                    <input
                        type="number"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2 px-3 transition-colors">
                        {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Account'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg py-2 px-3 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
            
        </form>
    )
}

export default AccountForm