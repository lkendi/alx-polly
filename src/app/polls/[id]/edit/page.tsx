"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { CreatePollForm } from "@/components/polls/create-poll-form";
import { pollsApi } from "@/lib/api/polls";
import { Poll } from "@/lib/types";
import { sanitizeInput } from "@/lib/utils/sanitize";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

export default function EditPollPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      setError("");
      const fetchedPoll = await pollsApi.getPollById(pollId);

      // Check if user owns this poll
      if (fetchedPoll.creatorId !== user?.id) {
        router.push("/dashboard");
        return;
      }

      setPoll(fetchedPoll);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load poll");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoll = async (data: {
    title: string;
    description: string;
    options: string[];
    isPublic: boolean;
    allowMultipleVotes: boolean;
    allowAddOptions: boolean;
    expiresAt?: string;
  }) => {
    if (!poll) return;

    setSaving(true);
    setError("");

    try {
      const updatedPoll = await pollsApi.updatePoll(poll.id, data);
      console.log("Poll updated:", updatedPoll);

      // Redirect to the updated poll
      router.push(`/polls/${poll.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update poll. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="space-y-3 mt-8">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Error Loading Poll</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="space-x-2">
                <Button onClick={fetchPoll}>Try Again</Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Poll Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The poll you're trying to edit doesn't exist or you don't have permission to edit it.
              </p>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto py-8">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Poll</h1>
            <p className="text-muted-foreground">
              Update your poll details and options
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/polls/${poll.id}`}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                View Poll
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 13-3 3-3-3" />
                </svg>
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Warning about editing active polls */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 text-yellow-600">
                <svg fill="currentColor" viewBox="0 0 20 20" className="h-full w-full">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <CardTitle className="text-lg text-yellow-800">
                Editing Active Poll
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              This poll has {poll.totalVotes} votes. Editing the poll will not affect existing votes,
              but adding or removing options may confuse voters who have already participated.
            </p>
          </CardContent>
        </Card>

        {/* Edit Poll Form */}
        <CreatePollForm
          onSubmit={handleUpdatePoll}
          isLoading={saving}
          error={error}
          initialData={{
            title: sanitizeInput(poll.title),
            description: poll.description ? sanitizeInput(poll.description) : "",
            options: poll.options.map(option => sanitizeInput(option.text)),
            isPublic: poll.isPublic,
            allowMultipleVotes: poll.allowMultipleVotes,
            allowAddOptions: poll.allowAddOptions,
            expiresAt: poll.expiresAt ? new Date(poll.expiresAt).toISOString().slice(0, 16) : "",
          }}
        />

        {/* Additional Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Poll Statistics</CardTitle>
            <CardDescription>
              Current performance of your poll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{poll.totalVotes}</div>
                <p className="text-xs text-muted-foreground">Total Votes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{poll.options.length}</div>
                <p className="text-xs text-muted-foreground">Options</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {poll.isPublic ? "Public" : "Private"}
                </div>
                <p className="text-xs text-muted-foreground">Visibility</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {poll.expiresAt ? (
                    new Date(poll.expiresAt) > new Date() ? "Active" : "Expired"
                  ) : "Never"}
                </div>
                <p className="text-xs text-muted-foreground">Expires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
