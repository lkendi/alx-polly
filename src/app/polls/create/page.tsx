"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreatePollForm } from "@/components/polls/create-poll-form";
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
import Link from "next/link";

export default function CreatePollPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreatePoll = async (data: {
    title: string;
    description: string;
    options: string[];
    isPublic: boolean;
    allowMultipleVotes: boolean;
    allowAddOptions: boolean;
    expiresAt?: string;
  }) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate successful poll creation
      console.log("Poll created:", data);

      // Generate mock poll ID
      const pollId = "poll_" + Date.now();

      // In a real app, you would get the poll ID from the API response
      router.push(`/polls/${pollId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create poll. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto py-8">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Poll
            </h1>
            <p className="text-muted-foreground">
              Create a new poll and share it with the community
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/polls">
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Polls
            </Link>
          </Button>
        </div>

        {/* Tips Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 text-blue-500">
                <svg
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  className="h-full w-full"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <CardTitle className="text-lg">
                Tips for Creating Great Polls
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    ✓ Do
                  </Badge>
                  <span className="text-sm">Use clear, specific questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    ✓ Do
                  </Badge>
                  <span className="text-sm">Provide balanced options</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    ✓ Do
                  </Badge>
                  <span className="text-sm">Add helpful descriptions</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    ✗ Avoid
                  </Badge>
                  <span className="text-sm">Leading or biased questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    ✗ Avoid
                  </Badge>
                  <span className="text-sm">Too many similar options</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    ✗ Avoid
                  </Badge>
                  <span className="text-sm">Overly complex language</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Poll Form */}
        <CreatePollForm
          onSubmit={handleCreatePoll}
          isLoading={isLoading}
          error={error}
        />

        {/* Additional Help */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
            <CardDescription>
              Resources to help you create effective polls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/help/poll-guidelines">Poll Guidelines</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help/best-practices">Best Practices</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help/examples">Example Polls</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/support">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
