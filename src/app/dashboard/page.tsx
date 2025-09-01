"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation"; // Added useParams
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
import { Poll } from "@/lib/types";
import { pollsApi } from "@/lib/api/polls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Dashboard stats interface
interface DashboardStats {
  totalPolls: number;
  totalVotes: number;
  myPolls: number;
  myVotes: number;
}

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
      { id: "1a", text: "JavaScript", votes: 45, pollId: "1" },
      { id: "1b", text: "Python", votes: 38, pollId: "1" },
      { id: "1c", text: "TypeScript", votes: 32, pollId: "1" },
      { id: "1d", text: "Go", votes: 15, pollId: "1" },
    ],
    creator: {
      id: "user1",
      username: "devjohn",
      email: "devjohn@example.com",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    },
    creatorId: "user1",
    totalVotes: 130,
    isPublic: true,
    allowMultipleVotes: false,
    allowAddOptions: false,
    expiresAt: new Date("2024-12-31"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    userVotes: [
      {
        id: "vote1",
        userId: "currentuser",
        pollId: "1",
        optionId: "1a",
        createdAt: new Date("2024-01-16"),
      },
    ],
  },
  {
    id: "2",
    title: "Best time for team meetings?",
    description: "",
    options: [
      { id: "2a", text: "9:00 AM", votes: 12, pollId: "2" },
      { id: "2b", text: "2:00 PM", votes: 8, pollId: "2" },
      { id: "2c", text: "4:00 PM", votes: 15, pollId: "2" },
    ],
    creator: {
      id: "currentuser",
      username: "johndoe",
      email: "john@example.com",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    },
    creatorId: "currentuser",
    totalVotes: 35,
    isPublic: false,
    allowMultipleVotes: false,
    allowAddOptions: false,
    expiresAt: new Date("2024-02-01"),
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
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
  const router = useRouter();
  const params = useParams(); // Added useParams
  const [stats, setStats] = useState<DashboardStats>({
    totalPolls: 0,
    totalVotes: 0,
    myPolls: 0,
    myVotes: 0,
  });
  const [recentPolls, setRecentPolls] = useState<Poll[]>([]);
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<string | null>(null);
  const [deletingPoll, setDeletingPoll] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null); //Added

  // Fetch dashboard data on component mount
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchPollData(); //Added to fetch poll data
    }
  }, [user, params?.pollId]); // Added params?.pollId to trigger re-fetch

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError("");

      // Fetch user's own polls
      const myPollsResponse = await pollsApi.getMyPolls(1, 10);

      // Fetch recent public polls for activity
      const recentPollsResponse = await pollsApi.getPolls(1, 5, {
        isPublic: true,
      });

      setRecentPolls(myPollsResponse.polls);

      // Calculate stats
      const myPolls = myPollsResponse.polls;
      const totalVotesInMyPolls = myPolls.reduce(
        (sum, poll) => sum + poll.totalVotes,
        0,
      );

      setStats({
        totalPolls: recentPollsResponse.pagination.total,
        totalVotes: totalVotesInMyPolls,
        myPolls: myPolls.length,
        myVotes: 0, // We'd need to fetch user's votes across all polls for this
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPollData = async () => {
    if (!params?.pollId) return; // Added null check

    try {
      const poll = await pollsApi.getPollById(params.pollId);
      setSelectedPoll(poll);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load poll data",
      );
    }
  };

  const handleEditPoll = (pollId: string) => {
    router.push(`/polls/${pollId}/edit`);
  };

  const handleDeletePoll = (pollId: string) => {
    setPollToDelete(pollId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePoll = async () => {
    if (!pollToDelete) return;

    try {
      setDeletingPoll(true);
      await pollsApi.deletePoll(pollToDelete);

      // Refresh dashboard data after deletion
      await fetchDashboardData();

      setDeleteDialogOpen(false);
      setPollToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete poll");
    } finally {
      setDeletingPoll(false);
    }
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      await pollsApi.voteOnPoll(pollId, optionIds);
      // Refresh dashboard data to update vote counts
      await fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote");
    }
  };

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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-8"></div>
                  ) : (
                    stats.myPolls
                  )}
                </div>
                <div className="ml-auto text-2xl">📝</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">My Polls</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-8"></div>
                  ) : (
                    stats.totalVotes
                  )}
                </div>
                <div className="ml-auto text-2xl">📊</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Votes Received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-purple-600">
                  {isLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-8"></div>
                  ) : (
                    stats.myVotes
                  )}
                </div>
                <div className="ml-auto text-2xl">🗳️</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">My Votes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-8"></div>
                  ) : (
                    stats.totalPolls
                  )}
                </div>
                <div className="ml-auto text-2xl">📋</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Community Polls
              </p>
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

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentPolls.length > 0 ? (
              <div className="space-y-4">
                {recentPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    currentUserId={user?.id}
                    onVote={handleVote}
                    onEdit={handleEditPoll}
                    onDelete={handleDeletePoll}
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

        {/* Quick Actions Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common actions to help you get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="text-2xl">📊</div>
                  <span className="text-sm">Browse Polls</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this poll? This action cannot be
              undone. All votes and poll data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPoll}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePoll}
              disabled={deletingPoll}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingPoll ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete Poll"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
