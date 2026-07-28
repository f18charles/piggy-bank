import { useState, useEffect } from "react"
import { apiGet } from "../../utils/Client"

const formatCurrency = (amount, currency = 'kes') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount || 0)
}

// mode: 'contribute' | 'withdraw'
const GoalFundsForm = ({ goal, mode, onSubmit, onCancel, isSubmitting }) => {
    const isWithdraw = mode === 'withdraw'

    const [accountId, setAccountId] = useState('')
    const [amount, setAmount] = useState('')

    const [accounts, setAccounts] = useState([])
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
    const [accountsError, setAccountsError] = useState(null)

    useEffect(() => {
        let ignore = false

        async function loadAccounts() {
            setIsLoadingAccounts(true)
            setAccountsError(null)
            try {
                const data = await apiGet("/accounts")
                if (!ignore) setAccounts(data || [])
            } catch (err) {
                if (!ignore) setAccountsError(err.message)
            } finally {
                if (!ignore) setIsLoadingAccounts(false)
            }
        }

        loadAccounts()

        return () => {
            ignore = true
        }
    }, [])

    const remaining = Math.max(Number(goal.target_amount) - Number(goal.current_amount), 0)
    const maxWithdraw = Number(goal.current_amount)

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            account_id: accountId,
            amount: Number(amount),
        })
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    {isWithdraw ? 'Withdraw from Goal' : 'Add Funds to Goal'}
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

            <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-gray-800">{goal.name}</p>
                <p className="text-xs text-gray-500">
                    {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)} saved
                    {!isWithdraw && remaining > 0 && ` • ${formatCurrency(remaining)} remaining`}
                </p>
            </div>

            {accountsError && (
                <div className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                    Couldn't load accounts: {accountsError}
                </div>
            )}

            <div>
                <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                    {isWithdraw ? 'Deposit to Account' : 'From Account'}
                </label>
                <select
                    id="accountId"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    disabled={isLoadingAccounts}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                    <option value="" disabled>
                        {isLoadingAccounts ? 'Loading accounts...' : 'Select an account'}
                    </option>
                    {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                            {account.name} {account.currency ? `(${account.currency})` : ''} — {formatCurrency(account.balance, account.currency)}
                        </option>
                    ))}
                </select>
                {!isLoadingAccounts && !accountsError && accounts.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                        No accounts found. Add an account first.
                    </p>
                )}
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
                    max={isWithdraw ? maxWithdraw : undefined}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {isWithdraw && (
                    <p className="text-xs text-gray-400 mt-1">
                        You can withdraw up to {formatCurrency(maxWithdraw)}
                    </p>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    type="submit" 
                    disabled={isSubmitting || isLoadingAccounts} 
                    className={`flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2 px-3 transition-colors ${
                        isWithdraw ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                    {isSubmitting ? 'Saving...' : isWithdraw ? 'Withdraw' : 'Add Funds'}
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

export default GoalFundsForm
