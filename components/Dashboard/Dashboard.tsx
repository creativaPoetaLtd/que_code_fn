import React from 'react'
import { StatCard } from './StatCard'
import { Analytics } from './Analytics'
import { TransactionList } from './TransactionList'
import { ExpenseStats } from './ExpenseStats'

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Total Income" amount="632,000" percentage={1.29} type="income" />
          <StatCard title="Total Outcome" amount="632,000" percentage={1.29} type="outcome" />
        </div>
        <Analytics />
        <TransactionList />
      </div>
      <div className="space-y-8">
        <ExpenseStats />
      </div>
    </div>
  )
}

export default Dashboard