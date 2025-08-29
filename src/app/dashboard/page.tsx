"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PollCard } from "@/components/polls/poll-card";
import { useAuth } from "@/lib/hooks/useAuth";

// Mock data for development

const mockStats = {
  totalPolls: 12,
  totalVotes: 1847,
  pollsCreated: 8,
  pollsVoted: 23,
  activePolls: 6,
  expiredPolls: 2,
};

const mockRecentPolls = [
  {
    id: "1",
    title: "What's your favorite programming language?",
    description:
      "Help us understand the most popular programming languages in our community.",
    options: [
      { id: "1a", text: "JavaScript", votes: 45 },
      { id: "1b", text: "Python", votes: 38 },
      { id: "1c", text: "TypeScript", votes: 32 },
      { id: "1d", text: "Go", votes: 15 },
    ],
    creator: {
      id: "currentuser",
      username: "johndoe",
      avatar: undefined,
    },
    totalVotes: 130,
    isPublic: true,
    allowMultipleVotes: false,
    expiresAt: new Date("2024-12-31"),
    createdAt: new Date("2024-01-15"),
    hasVoted: true,
    userVotes: ["1a"],
  },
  {
    id: "2",
    title: "Best time for team meetings?",
    description: "",
    options: [
      { id: "2a", text: "9:00 AM", votes: 12 },
      { id: "2b", text: "2:00 PM", votes: 8 },
      { id: "2c", text: "4:00 PM", votes: 15 },
    ],
    creator: {
      id: "currentuser",
      username: "johndoe",
      avatar: undefined,
    },
    totalVotes: 35,
    isPublic: false,
    allowMultipleVotes: false,
    expiresAt: new Date("2024-02-01"),
    createdAt: new Date("2024-01-25"),
    hasVoted: false,
    userVotes: [],
  },
];

const mockRecentActivity = [
  {
    id: "1",
    type: "vote",
    pollTitle: "Which features should we prioritize?",
    pollId: "poll_3",
    timestamp: new Date("2024-01-26T10:30:00Z"),
    details: 'Voted for "Dark mode" and "Mobile app"',
  },
  {
    id: "2",
    type: "create",
    pollTitle: "Best time for team meetings?",
    pollId: "poll_2",
    timestamp: new Date("2024-01-25T14:15:00Z"),
    details: "Created new poll with 3 options",
  },
  {
    id: "3",
    type: "vote",
    pollTitle: "What's your favorite programming language?",
    pollId: "poll_1",
    timestamp: new Date("2024-01-24T09:45:00Z"),
    details: 'Voted for "JavaScript"',
  },
  {
    id: "4",
    type: "create",
    pollTitle: "Office lunch preferences",
    pollId: "poll_4",
    timestamp: new Date("2024-01-23T16:20:00Z"),
    details: "Created new poll with 5 options",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(mockStats);
  const [recentPolls, setRecentPolls] = useState(mockRecentPolls);
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "vote":
        return "🗳️";
      case "create":
        return "📝";
      case "comment":
        return "💬";
      default:
        return "📊";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "vote":
        return "text-blue-600";
      case "create":
        return "text-green-600";
      case "comment":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back,{" "}
            {user?.user_metadata?.username ||
              user?.email?.split("@")[0] ||
              "User"}
            !
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your polls and activity
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.pollsCreated}
                </div>
                <div className="ml-auto text-2xl">📝</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Polls Created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalVotes}
                </div>
                <div className="ml-auto text-2xl">📊</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Votes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.pollsVoted}
                </div>
                <div className="ml-auto text-2xl">🗳️</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Polls Voted</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.activePolls}
                </div>
                <div className="ml-auto text-2xl">⚡</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active Polls</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into your most common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Button asChild className="h-16 flex-col space-y-2">
                <Link href="/polls/create">
                  <div className="text-2xl">➕</div>
                  <span className="text-sm">Create Poll</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                className="h-16 flex-col space-y-2"
              >
                <Link href="/polls">
                  <div className="text-2xl">🔍</div>
                  <span className="text-sm">Browse Polls</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                className="h-16 flex-col space-y-2"
              >
                <Link href="/dashboard/polls">
                  <div className="text-2xl">📋</div>
                  <span className="text-sm">My Polls</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                className="h-16 flex-col space-y-2"
              >
                <Link href="/analytics">
                  <div className="text-2xl">📈</div>
                  <span className="text-sm">Analytics</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Polls */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Recent Polls</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/polls">View All</Link>
              </Button>
            </div>

            {recentPolls.length > 0 ? (
              <div className="space-y-4">
                {recentPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    currentUserId={user?.id}
                    showActions={true}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="font-semibold mb-2">No polls yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first poll to get started
                  </p>
                  <Button asChild>
                    <Link href="/polls/create">Create Your First Poll</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/activity">View All</Link>
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="text-xl">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            <span className={getActivityColor(activity.type)}>
                              {activity.type === "vote"
                                ? "Voted on"
                                : "Created"}
                            </span>{" "}
                            <Link
                              href={`/polls/${activity.pollId}`}
                              className="text-foreground hover:underline"
                            >
                              {activity.pollTitle}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="font-semibold mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Create or vote on polls to see your activity here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Achievement or Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🏆</span>
              <span>Your Progress</span>
            </CardTitle>
            <CardDescription>
              Keep engaging with the community to unlock achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Poll Creator</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.pollsCreated}/10
                  </span>
                </div>
                <Progress
                  value={(stats.pollsCreated / 10) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Create {10 - stats.pollsCreated} more polls to earn the "Poll
                  Master" badge
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Community Voter</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.pollsVoted}/50
                  </span>
                </div>
                <Progress
                  value={(stats.pollsVoted / 50) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  Vote on {50 - stats.pollsVoted} more polls to earn the
                  "Community Voice" badge
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
