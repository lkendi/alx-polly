"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PollCard } from "@/components/polls/poll-card";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

// Mock poll type for this page
interface MockPoll {
  id: string;
  title: string;
  description: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
  totalVotes: number;
  isPublic: boolean;
  allowMultipleVotes: boolean;
  expiresAt?: Date;
  createdAt: Date;
  hasVoted: boolean;
  userVotes: string[];
}

// Mock data for development
const mockPolls: MockPoll[] = [
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
      id: "user1",
      username: "devjohn",
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
    title: "Which features should we prioritize for the next release?",
    description:
      "Your input helps us decide what to build next. Select multiple options if needed.",
    options: [
      { id: "2a", text: "Dark mode", votes: 67 },
      { id: "2b", text: "Mobile app", votes: 89 },
      { id: "2c", text: "API access", votes: 34 },
      { id: "2d", text: "Real-time notifications", votes: 56 },
      { id: "2e", text: "Advanced analytics", votes: 23 },
    ],
    creator: {
      id: "user2",
      username: "productmanager",
    },
    totalVotes: 269,
    isPublic: true,
    allowMultipleVotes: true,
    createdAt: new Date("2024-01-20"),
    hasVoted: false,
    userVotes: [],
  },
  {
    id: "3",
    title: "Best time for team meetings?",
    description: "",
    options: [
      { id: "3a", text: "9:00 AM", votes: 12 },
      { id: "3b", text: "2:00 PM", votes: 8 },
      { id: "3c", text: "4:00 PM", votes: 15 },
    ],
    creator: {
      id: "user3",
      username: "teamlead",
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

export default function PollsPage() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<MockPoll[]>(mockPolls as MockPoll[]);
  const [filteredPolls, setFilteredPolls] = useState<MockPoll[]>(
    mockPolls as MockPoll[],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created");
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort polls based on current filters
  useEffect(() => {
    let filtered = [...polls];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (poll) =>
          poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          poll.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          poll.creator.username
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Category filter
    if (filterBy !== "all") {
      switch (filterBy) {
        case "public":
          filtered = filtered.filter((poll) => poll.isPublic);
          break;
        case "private":
          filtered = filtered.filter((poll) => !poll.isPublic);
          break;
        case "voted":
          filtered = filtered.filter((poll) => poll.hasVoted);
          break;
        case "not-voted":
          filtered = filtered.filter((poll) => !poll.hasVoted);
          break;
        case "active":
          filtered = filtered.filter(
            (poll) => !poll.expiresAt || new Date() < poll.expiresAt,
          );
          break;
        case "expired":
          filtered = filtered.filter(
            (poll) => poll.expiresAt && new Date() > poll.expiresAt,
          );
          break;
      }
    }

    // Sort polls
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "votes":
          return b.totalVotes - a.totalVotes;
        case "title":
          return a.title.localeCompare(b.title);
        case "expiry":
          if (!a.expiresAt && !b.expiresAt) return 0;
          if (!a.expiresAt) return 1;
          if (!b.expiresAt) return -1;
          return (
            new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredPolls(filtered);
  }, [polls, searchQuery, sortBy, filterBy]);

  const handleVote = async (pollId: string, optionIds: string[]) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the poll with the vote
    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map((option) => ({
            ...option,
            votes: optionIds.includes(option.id)
              ? option.votes + 1
              : option.votes,
          }));

          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + optionIds.length,
            hasVoted: true,
            userVotes: optionIds,
          };
        }
        return poll;
      }),
    );

    setIsLoading(false);
  };

  const stats = {
    total: polls.length,
    public: polls.filter((p) => p.isPublic).length,
    voted: polls.filter((p) => p.hasVoted).length,
    active: polls.filter((p) => !p.expiresAt || new Date() < p.expiresAt)
      .length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto py-8">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse Polls</h1>
            <p className="text-muted-foreground">
              Discover and vote on polls from the community
            </p>
          </div>
          <Button asChild>
            <Link href="/polls/create">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Poll
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Polls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">Active Polls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.public}
              </div>
              <p className="text-xs text-muted-foreground">Public Polls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {stats.voted}
              </div>
              <p className="text-xs text-muted-foreground">Voted On</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Polls</CardTitle>
            <CardDescription>
              Search and filter polls to find what you're looking for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search polls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex space-x-2">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Polls</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="voted">Voted</SelectItem>
                    <SelectItem value="not-voted">Not Voted</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Latest</SelectItem>
                    <SelectItem value="votes">Most Votes</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="expiry">Expiry Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {(searchQuery || filterBy !== "all") && (
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-muted-foreground">
              Showing {filteredPolls.length} of {polls.length} polls
            </span>
            {searchQuery && (
              <Badge variant="secondary">Search: "{searchQuery}"</Badge>
            )}
            {filterBy !== "all" && (
              <Badge variant="secondary">Filter: {filterBy}</Badge>
            )}
            {(searchQuery || filterBy !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        )}

        {/* Polls List */}
        {filteredPolls.length > 0 ? (
          <div className="space-y-6">
            {filteredPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                currentUserId={user?.id}
                onVote={handleVote}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="h-full w-full"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No polls found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterBy !== "all"
                    ? "Try adjusting your search or filters to find more polls."
                    : "Be the first to create a poll for the community!"}
                </p>
                <Button asChild>
                  <Link href="/polls/create">Create Your First Poll</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Load More Button (for future pagination) */}
        {filteredPolls.length > 0 && filteredPolls.length >= 10 && (
          <div className="text-center mt-8">
            <Button variant="outline" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                "Load More Polls"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
