"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/layout/header";
import { pollsApi } from "@/lib/api/polls";
import { Poll } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface PollDetailPageProps {}

export default function PollDetailPage({}: PollDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [addingOption, setAddingOption] = useState(false);
  const [showAddOption, setShowAddOption] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      setError("");
      const fetchedPoll = await pollsApi.getPollById(pollId);
      setPoll(fetchedPoll);

      // Check if user has already voted
      if (fetchedPoll.userVotes && fetchedPoll.userVotes.length > 0) {
        setHasVoted(true);
        setShowResults(true);
        setSelectedOptions(fetchedPoll.userVotes.map(vote => vote.optionId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load poll");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) return;

    try {
      setVoting(true);
      await pollsApi.voteOnPoll(poll.id, selectedOptions);
      setHasVoted(true);
      setShowResults(true);

      // Refresh poll data to get updated vote counts
      await fetchPoll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote");
    } finally {
      setVoting(false);
    }
  };

  const handleOptionSelect = (optionId: string, checked: boolean) => {
    if (!poll) return;

    if (poll.allowMultipleVotes) {
      if (checked) {
        setSelectedOptions([...selectedOptions, optionId]);
      } else {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      }
    } else {
      setSelectedOptions(checked ? [optionId] : []);
    }
  };

  const handleAddOption = async () => {
    if (!poll || !newOptionText.trim()) return;

    try {
      setAddingOption(true);
      await pollsApi.addOption(poll.id, newOptionText.trim());
      setNewOptionText("");
      setShowAddOption(false);

      // Refresh poll data
      await fetchPoll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add option");
    } finally {
      setAddingOption(false);
    }
  };

  const getOptionPercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const isExpired = poll?.expiresAt && new Date(poll.expiresAt) < new Date();
  const canVote = user && !hasVoted && !isExpired;
  const canAddOptions = poll?.allowAddOptions && user && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <Card className="max-w-4xl mx-auto">
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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8">
          <Card className="max-w-4xl mx-auto">
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
                  <Link href="/polls">Back to Polls</Link>
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
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Poll Not Found</h2>
              <p className="text-muted-foreground mb-4">The poll you're looking for doesn't exist or has been removed.</p>
              <Button asChild>
                <Link href="/polls">Browse Other Polls</Link>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Navigation */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/polls">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Polls
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Poll Details</span>
          </div>

          {/* Poll Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl md:text-3xl mb-2">{poll.title}</CardTitle>
                  {poll.description && (
                    <CardDescription className="text-base">{poll.description}</CardDescription>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {poll.isPublic ? (
                    <Badge variant="default">Public</Badge>
                  ) : (
                    <Badge variant="secondary">Private</Badge>
                  )}
                  {isExpired && (
                    <Badge variant="destructive">Expired</Badge>
                  )}
                  {poll.allowMultipleVotes && (
                    <Badge variant="outline">Multiple Choice</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {poll.creator.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{poll.creator.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(poll.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{poll.totalVotes}</span> total votes
                </div>
                {poll.expiresAt && (
                  <>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-sm text-muted-foreground">
                      Expires {formatDistanceToNow(poll.expiresAt, { addSuffix: true })}
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Voting/Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {showResults ? "Results" : "Cast Your Vote"}
                </span>
                {hasVoted && !showResults && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResults(true)}
                  >
                    View Results
                  </Button>
                )}
                {hasVoted && showResults && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResults(false)}
                  >
                    Hide Results
                  </Button>
                )}
              </CardTitle>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
            </CardHeader>

            <CardContent>
              {!showResults ? (
                <div className="space-y-4">
                  {poll.allowMultipleVotes ? (
                    <div className="space-y-3">
                      {poll.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={option.id}
                            checked={selectedOptions.includes(option.id)}
                            onCheckedChange={(checked) => handleOptionSelect(option.id, checked as boolean)}
                            disabled={!canVote}
                          />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RadioGroup
                      value={selectedOptions[0] || ""}
                      onValueChange={(value) => setSelectedOptions([value])}
                      disabled={!canVote}
                    >
                      {poll.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {canVote && (
                    <Button
                      onClick={handleVote}
                      disabled={voting || selectedOptions.length === 0}
                      className="w-full"
                    >
                      {voting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting Vote...</span>
                        </div>
                      ) : (
                        `Vote${poll.allowMultipleVotes && selectedOptions.length > 1 ? ` (${selectedOptions.length} selected)` : ""}`
                      )}
                    </Button>
                  )}

                  {!user && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-blue-800 mb-2">Sign in to vote on this poll</p>
                      <Button asChild size="sm">
                        <Link href="/auth/login">Sign In</Link>
                      </Button>
                    </div>
                  )}

                  {isExpired && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-600">This poll has expired and is no longer accepting votes.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {poll.options.map((option) => {
                    const percentage = getOptionPercentage(option.votes);
                    const isUserChoice = selectedOptions.includes(option.id);

                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${isUserChoice ? "text-blue-600" : ""}`}>
                            {option.text}
                            {isUserChoice && " ✓"}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {option.votes} votes
                            </span>
                            <span className="text-sm font-medium">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}

                  {hasVoted && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 text-green-800">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Thank you for voting!</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Your vote has been recorded successfully.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Option Section */}
          {canAddOptions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggest an Option</CardTitle>
                <CardDescription>
                  This poll allows users to add new options
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showAddOption ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddOption(true)}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Option
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newOption">New Option</Label>
                      <Input
                        id="newOption"
                        placeholder="Enter your option..."
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleAddOption}
                        disabled={addingOption || !newOptionText.trim()}
                        className="flex-1"
                      >
                        {addingOption ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Adding...</span>
                          </div>
                        ) : (
                          "Add Option"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddOption(false);
                          setNewOptionText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Share Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Share This Poll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input
                  value={typeof window !== 'undefined' ? window.location.href : ''}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
