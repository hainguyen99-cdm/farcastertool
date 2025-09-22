'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  totalScenarios: number;
  totalExecutions: number;
  successRate: number;
  recentLogs: Array<{
    _id: string;
    timestamp: string;
    accountId?: string;
    scenarioId?: string;
    scenarioName?: string;
    accountName: string;
    actionType: string;
    status: string;
  }>;
  actionDistribution: Array<{
    actionType: string;
    count: number;
  }>;
  executionTrends: Array<{
    date: string;
    executions: number;
    successes: number;
  }>;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    totalScenarios: 0,
    totalExecutions: 0,
    successRate: 0,
    recentLogs: [],
    actionDistribution: [],
    executionTrends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();

      // Fallbacks: compute charts data if backend doesn't provide
      const ensureActionDistribution = ((): Array<{ actionType: string; count: number }> => {
        if (Array.isArray(data.actionDistribution)) return data.actionDistribution;
        const map: Record<string, number> = {};
        (data.recentLogs as Array<{ actionType: string }> | undefined)?.forEach((log) => {
          const key = log.actionType || 'Unknown';
          map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([actionType, count]) => ({ actionType, count }));
      })();

      const ensureExecutionTrends = ((): Array<{ date: string; executions: number; successes: number }> => {
        if (Array.isArray(data.executionTrends)) return data.executionTrends;
        const map: Record<string, { executions: number; successes: number }> = {};
        (data.recentLogs as Array<{ timestamp: string; status: string }> | undefined)?.forEach((log) => {
          const date = new Date(log.timestamp).toISOString().slice(0, 10);
          if (!map[date]) map[date] = { executions: 0, successes: 0 };
          map[date].executions += 1;
          if (String(log.status).toLowerCase() === 'success') map[date].successes += 1;
        });
        return Object.entries(map)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([date, v]) => ({ date, executions: v.executions, successes: v.successes }));
      })();

      setStats({
        totalAccounts: data.totalAccounts ?? 0,
        activeAccounts: data.activeAccounts ?? 0,
        totalScenarios: data.totalScenarios ?? 0,
        totalExecutions: data.totalExecutions ?? 0,
        successRate: data.successRate ?? 0,
        recentLogs: Array.isArray(data.recentLogs) ? data.recentLogs : [],
        actionDistribution: ensureActionDistribution,
        executionTrends: ensureExecutionTrends,
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const successRateData = {
    labels: ['Success', 'Failure'],
    datasets: [
      {
        data: [stats.successRate, 100 - stats.successRate],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const actionDistributionData = {
    labels: stats.actionDistribution.map(item => item.actionType),
    datasets: [
      {
        label: 'Executions',
        data: stats.actionDistribution.map(item => item.count),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#84cc16',
          '#f97316',
        ],
        borderWidth: 0,
      },
    ],
  };

  const executionTrendsData = {
    labels: stats.executionTrends.map(trend => trend.date),
    datasets: [
      {
        label: 'Total Executions',
        data: stats.executionTrends.map(trend => trend.executions),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Successful Executions',
        data: stats.executionTrends.map(trend => trend.successes),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const formatRelativeTime = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accounts</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalAccounts}</p>
          <p className="text-sm text-gray-500">{stats.activeAccounts} active</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Scenarios</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalScenarios}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Executions</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalExecutions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.successRate}%</p>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Success Rate</h3>
          <div className="h-64">
            <Doughnut data={successRateData} options={chartOptions} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Action Distribution</h3>
          <div className="h-64">
            <Bar data={actionDistributionData} options={barChartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Trends (Last 7 Days)</h3>
          <div className="h-64">
            <Line data={executionTrendsData} options={lineChartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentLogs.length > 0 ? (
                stats.recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900" title={new Date(log.timestamp).toLocaleString()}>
                      {formatRelativeTime(log.timestamp)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600">
                      {log.accountId ? (
                        <Link href={`/accounts/${log.accountId}`} className="hover:underline">{log.accountName}</Link>
                      ) : (
                        <span>{log.accountName}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600">
                      {log.scenarioId ? (
                        <Link href={`/scenarios/${log.scenarioId}`} className="hover:underline">{log.scenarioName || 'Scenario'}</Link>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {log.actionType}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'Success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                        aria-label={`Status: ${log.status}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                    No recent activity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
