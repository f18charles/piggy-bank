const DashData = {
    netWorth: {
        totalAssets: 245000,
        totalLiabilities: 82000,
        netWorth: 163000,
        changePercentage: 2.4,
        currency: "kes"
    },

    monthlyBurn: {
        averageMonthlySpend: 4850,
        monthlyIncome: 7200,
        burnRate: 67.36,
        projectedRunway: 33.6,
        currency: "kes"
    },

    accounts: [
        {
        id: "acc_001",
        name: "Chase Checking",
        type: "checking",
        balance: 12450.75,
        currency: "kes"
        },
        {
        id: "acc_002",
        name: "Vanguard Roth IRA",
        type: "investment",
        balance: 87650.30,
        currency: "kes"
        },
        {
        id: "acc_003",
        name: "Amex Platinum",
        type: "credit",
        balance: -3240.50,
        currency: "kes"
        }
    ],

    budgetHealth: [
        {
        categoryName: "Housing",
        spent: 1850.00,
        budget: 2000.00,
        percentage: 92.5,
        color: "#4CAF50"
        },
        {
        categoryName: "Groceries",
        spent: 420.30,
        budget: 600.00,
        percentage: 70.05,
        color: "#2196F3"
        },
        {
        categoryName: "Entertainment",
        spent: 20.00,
        budget: 300.00,
        percentage: 7,
        color: "#FF9800"
        }
    ],
    
    goalsProgress: [
        {
        id: "goal_001",
        name: "Emergency Fund",
        targetAmount: 30000,
        currentAmount: 27000,
        percentage: 90,
        deadline: "2026-12-31"
        },
        {
        id: "goal_002",
        name: "Down Payment",
        targetAmount: 60000,
        currentAmount: 42000,
        percentage: 70,
        deadline: "2027-06-30"
        },
        {
        id: "goal_003",
        name: "Vacation Fund",
        targetAmount: 5000,
        currentAmount: 1000,
        percentage: 20,
        deadline: "2026-09-15"
        }
    ]
}

export default DashData