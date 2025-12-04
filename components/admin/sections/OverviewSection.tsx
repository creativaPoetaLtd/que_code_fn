'use client';

import { cn } from '@/lib/utils';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import KPICard, { Sparkline, MiniKPI } from '../KPICard';
import AlertsList, { mockAlerts } from '../AlertsList';
import Table, { 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  TableMainText, 
  TableSubText 
} from '../ui/Table';
import Button from '../ui/Button';
import { TransactionChart } from '../charts/Charts';

export default function OverviewSection() {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total users"
          value={184532}
          label="Verified accounts"
          badge={{ text: '+312 today', variant: 'success' }}
          trend={{ direction: 'up', value: '+3.2%', timeframe: 'last 7 days' }}
          sparkline={<Sparkline type="users" />}
        />
        
        <KPICard
          title="Organizations"
          value={2184}
          label="NGOs, merchants, events, transport"
          badge={{ text: '9 pending', variant: 'warning' }}
          trend={{ direction: 'up', value: '+1.1%', timeframe: 'last 30 days' }}
          sparkline={<Sparkline type="orgs" />}
        />
        
        <KPICard
          title="24h volume"
          value="€482,910"
          label="Wallet → wallet, pay, votes, donations"
          badge={{ text: 'Live', variant: 'live' }}
          trend={{ direction: 'up', value: '+12.3%', timeframe: 'daily avg' }}
          sparkline={<Sparkline type="volume" />}
        />
        
        <KPICard
          title="Risk / fraud"
          value="0.8%"
          label="Transactions flagged in last 24h"
          badge={{ text: 'Engine v1.0', variant: 'success' }}
          trend={{ direction: 'up', value: '+0.2 pts', timeframe: 'baseline' }}
          sparkline={<Sparkline type="risk" />}
        />
      </div>

      {/* Charts and Alerts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Card */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Transactions & disputes</CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Wallet → wallet, pay, donations, votes (last 7 days)
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-green-400 to-green-600"></span>
                Transactions
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"></span>
                Disputes
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionChart />
            <p className="text-xs text-slate-400 mt-3">
              Suspicious or blocked flows are excluded from the main curve and visible in the risk engine.
            </p>
          </CardContent>
        </Card>

        {/* Alerts Card */}
        <Card>
          <CardHeader>
            <CardTitle>Live alerts</CardTitle>
            <Badge variant="warning">Security & disputes</Badge>
          </CardHeader>
          <CardContent>
            <AlertsList alerts={mockAlerts} />
          </CardContent>
        </Card>
      </div>

      {/* Flow Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow</TableHead>
                <TableHead>Today</TableHead>
                <TableHead>Last 7 days</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total transactions</TableCell>
                <TableCell>18,420</TableCell>
                <TableCell>112,380</TableCell>
                <TableCell>
                  <Badge variant="success" size="sm">
                    <span className="w-3 h-3">↑</span>+11.2%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="muted" size="sm">Healthy</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Actions created</TableCell>
                <TableCell>312</TableCell>
                <TableCell>2,104</TableCell>
                <TableCell>
                  <Badge variant="success" size="sm">
                    <span className="w-3 h-3">↑</span>+6.5%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="muted" size="sm">Normal</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>New organisations</TableCell>
                <TableCell>17</TableCell>
                <TableCell>86</TableCell>
                <TableCell>
                  <Badge variant="warning" size="sm">
                    <span className="w-3 h-3">→</span>Stable
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="muted" size="sm">Review docs</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Refunds processed</TableCell>
                <TableCell>64</TableCell>
                <TableCell>402</TableCell>
                <TableCell>
                  <Badge variant="warning" size="sm">
                    <span className="w-3 h-3">↑</span>+2.1%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="warning" size="sm">Monitor</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Failed / blocked</TableCell>
                <TableCell>0.7%</TableCell>
                <TableCell>0.8%</TableCell>
                <TableCell>
                  <Badge variant="success" size="sm">
                    <span className="w-3 h-3">↓</span>-0.1 pt
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="success" size="sm">OK</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial & Events Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Financial snapshot */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Financial snapshot</CardTitle>
            <Badge variant="warning">Internal view only</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MiniKPI
                label="Float on main bank account"
                value="€6,420,000"
                meta="All currencies converted to EUR"
              />
              <MiniKPI
                label="Funds reserved (disputes & holds)"
                value="€182,400"
                meta="Across 241 transactions"
              />
              <MiniKPI
                label="QC revenue (last 30 days)"
                value="€42,380"
                meta="Fees, commissions, FX margin"
              />
              <MiniKPI
                label="Avg dispute resolution time"
                value="2.4 days"
                meta="From open to admin decision"
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's top events */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Today's top events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Badge variant="success" size="sm">Org approved</Badge>
                  </TableCell>
                  <TableCell>Simba Express</TableCell>
                  <TableCell>Category: Transport • Action permissions granted</TableCell>
                  <TableCell>09:41</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge variant="warning" size="sm">Org locked</Badge>
                  </TableCell>
                  <TableCell>NGO FutureCare</TableCell>
                  <TableCell>Wallet force-locked due to AML alert</TableCell>
                  <TableCell>08:55</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge variant="danger" size="sm">Rule triggered</Badge>
                  </TableCell>
                  <TableCell>Action VT-552</TableCell>
                  <TableCell>Duplicate seat scans detected</TableCell>
                  <TableCell>08:16</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Badge variant="muted" size="sm">Config change</Badge>
                  </TableCell>
                  <TableCell>Fees</TableCell>
                  <TableCell>Donation commission set to 1.2% for NGOs</TableCell>
                  <TableCell>07:22</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}