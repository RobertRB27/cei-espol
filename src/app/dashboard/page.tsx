'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Clock, Calendar, FileCheck2, FileX2, FileClock } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/applications/types';

// Mock application data for dashboard display
const recentApplications = [
  {
    id: 1,
    codification: 'CEISH-ESPOL-23-04-EO-SH-001',
    title: 'Study on cognitive development in children',
    status: 'UNDER_REVIEW',
    submitted: '2023/04/15T14:30:00Z'
  },
  {
    id: 2,
    codification: 'CEISH-ESPOL-23-05-EI-GE-002',
    title: 'Analysis of coastal erosion patterns',
    status: 'NOT_SUBMITTED',
    submitted: null
  },
  {
    id: 3,
    codification: 'CEISH-ESPOL-23-05-EI-AN-003',
    title: 'Effects of new fertilizer on crop yield',
    status: 'ACCEPTED',
    submitted: '2023/05/11T16:45:00Z'
  }
];

// Statistic cards for the dashboard
const StatCard = ({ icon, title, value, description, color }: { 
  icon: React.ReactNode, 
  title: string, 
  value: string | number, 
  description: string,
  color: string 
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role_id;

  // Different dashboard views based on user role
  const userStats = [
    { 
      icon: <FileCheck2 className="h-5 w-5 text-green-700" />, 
      title: 'Approved',
      value: 3, 
      description: 'Applications approved', 
      color: 'bg-green-100'
    },
    { 
      icon: <FileClock className="h-5 w-5 text-blue-700" />, 
      title: 'Pending',
      value: 2, 
      description: 'Applications in review', 
      color: 'bg-blue-100'
    },
    { 
      icon: <FileX2 className="h-5 w-5 text-red-700" />, 
      title: 'Rejected',
      value: 1, 
      description: 'Applications rejected', 
      color: 'bg-red-100'
    },
    { 
      icon: <Calendar className="h-5 w-5 text-purple-700" />, 
      title: 'This Month',
      value: 2, 
      description: 'Applications submitted', 
      color: 'bg-purple-100'
    },
  ];

  // Stats for reviewers (role_id = 3)
  const reviewerStats = [
    { 
      icon: <FileClock className="h-5 w-5 text-blue-700" />, 
      title: 'Pending Review',
      value: 5, 
      description: 'Applications to review', 
      color: 'bg-blue-100'
    },
    { 
      icon: <FileCheck2 className="h-5 w-5 text-green-700" />, 
      title: 'Reviewed',
      value: 12, 
      description: 'Applications completed', 
      color: 'bg-green-100'
    },
    { 
      icon: <Clock className="h-5 w-5 text-yellow-700" />, 
      title: 'Urgent',
      value: 3, 
      description: 'High priority reviews', 
      color: 'bg-yellow-100'
    },
    { 
      icon: <BarChart3 className="h-5 w-5 text-purple-700" />, 
      title: 'Efficiency',
      value: '92%', 
      description: 'Review completion rate', 
      color: 'bg-purple-100'
    },
  ];
  
  // Select stats based on user role
  const stats = userRole === 3 ? reviewerStats : userStats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name || 'User'}. Here's an overview of your activities.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard 
            key={index} 
            icon={stat.icon} 
            title={stat.title} 
            value={stat.value} 
            description={stat.description} 
            color={stat.color} 
          />
        ))}
      </div>
      
      {/* Recent Applications Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>
              {userRole === 3 ? 'Recently assigned for review' : 'Your recently created applications'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.map(app => (
                <div key={app.id} className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h4 className="font-medium">{app.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-muted-foreground">{app.codification}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {app.submitted ? `Submitted: ${formatDate(app.submitted)}` : 'Draft'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/applications">
                View All Applications
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Actions Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userRole === 3 ? (
              // Reviewer actions
              <>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/review">
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Review Pending Applications
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/review/history">
                    <Clock className="mr-2 h-4 w-4" />
                    View Review History
                  </Link>
                </Button>
              </>
            ) : (
              // Regular user actions
              <>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/applications/new">
                    <Calendar className="mr-2 h-4 w-4" />
                    Create New Application
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/authorizations">
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    View Authorizations
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/updates">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Check Status Updates
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
