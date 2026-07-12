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

    // Reusable helper for refetching after a create/edit/delete -- called
    // from event handlers below, never from an effect, so it's free to set
    // state however it needs to.
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

    // The initial load gets its own effect-local function (same shape as
    // Dashboard.jsx's) rather than calling loadAccounts directly -- lint
    // treats a function invoked *inline inside* an effect differently from
    // a named helper referenced by identifier, even when both are
    // equally safe in practice.
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
            // Re-fetching from the server after a mutation, rather than
            // patching local state by hand, guarantees what's on screen
            // matches what the backend actually saved -- simpler to reason
            // about than keeping two copies of the same data in sync.
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

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
                <button
                    onClick={openCreateForm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                >
                    + Add Account
                </button>
            </div>

            {actionError && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-4">
                    {actionError}
                </p>
            )}

            {isFormOpen && (
                <div className="mb-6">
                    <AccountForm
                        initialAccount={editingAccount}
                        onSubmit={handleSubmit}
                        onCancel={closeForm}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}

            {isLoading ? (
                <p className="text-sm text-gray-500">Loading accounts...</p>
            ) : error ? (
                <p className="text-sm text-rose-600">Couldn't load accounts: {error}</p>
            ) : accounts.length === 0 ? (
                <p className="text-sm text-gray-500">No accounts yet -- add your first one above.</p>
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