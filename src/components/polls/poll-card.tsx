"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Poll, Vote } from "@/lib/types";

interface PollCardProps {
  poll: Poll;
  currentUserId?: string;
  onVote?: (pollId: string, optionIds: string[]) => void;
  onDelete?: (pollId: string) => void;
  onEdit?: (pollId: string) => void;
  showActions?: boolean;
  variant?: "default" | "compact";
}

export function PollCard({
  poll,
  currentUserId,
  onVote,
  onDelete,
  onEdit,
  showActions = true,
  variant = "default",
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    poll.userVotes?.map((vote) => vote.optionId) || [],
  );
  const [isVoting, setIsVoting] = useState(false);

  const isCreator = currentUserId === poll.creator.id;
  const isExpired = poll.expiresAt && new Date() > poll.expiresAt;
  const hasVoted = poll.userVotes && poll.userVotes.length > 0;
  const canVote = !hasVoted && !isExpired && currentUserId;

  const handleOptionToggle = (optionId: string) => {
    if (!canVote) return;

    setSelectedOptions((prev) => {
      if (poll.allowMultipleVotes) {
        return prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];
      } else {
        return prev.includes(optionId) ? [] : [optionId];
      }
    });
  };

  const handleVote = async () => {
    if (!canVote || selectedOptions.length === 0) return;

    setIsVoting(true);
    try {
      await onVote?.(poll.id, selectedOptions);
    } finally {
      setIsVoting(false);
    }
  };

  const getOptionPercentage = (votes: number) => {
    return poll.totalVotes > 0 ? (votes / poll.totalVotes) * 100 : 0;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1 min-w-0">
              <Link href={`/polls/${poll.id}`} className="hover:underline">
                <h3 className="font-semibold text-sm truncate">{poll.title}</h3>
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                by {poll.creator.username} • {poll.totalVotes} votes
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {!poll.isPublic && (
                <Badge variant="secondary" className="text-xs">
                  Private
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={poll.creator.avatar}
                alt={poll.creator.username}
              />
              <AvatarFallback>
                {poll.creator.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Link href={`/polls/${poll.id}`} className="hover:underline">
                <CardTitle className="text-lg leading-tight">
                  {poll.title}
                </CardTitle>
              </Link>
              {poll.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {poll.description}
                </CardDescription>
              )}
              <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                <span>by {poll.creator.username}</span>
                <span>•</span>
                <span>{formatDate(poll.createdAt)}</span>
                {poll.expiresAt && (
                  <>
                    <span>•</span>
                    <span className={isExpired ? "text-red-500" : ""}>
                      {isExpired
                        ? "Expired"
                        : `Expires ${formatDate(poll.expiresAt)}`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {showActions && (isCreator || currentUserId) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/polls/${poll.id}`}>View Details</Link>
                </DropdownMenuItem>
                {isCreator && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(poll.id)}>
                      Edit Poll
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(poll.id)}
                      className="text-red-600"
                    >
                      Delete Poll
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-3">
          {!poll.isPublic && <Badge variant="secondary">Private</Badge>}
          {poll.allowMultipleVotes && (
            <Badge variant="outline">Multiple Choice</Badge>
          )}
          {isExpired && <Badge variant="destructive">Expired</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {poll.options.map((option) => {
          const percentage = getOptionPercentage(option.votes);
          const isSelected = selectedOptions.includes(option.id);
          const showResults = hasVoted || isExpired || isCreator;

          return (
            <div key={option.id} className="space-y-2">
              <div
                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                  canVote
                    ? isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                    : "cursor-default"
                }`}
                onClick={() => handleOptionToggle(option.id)}
              >
                <div className="flex items-center space-x-3">
                  {canVote && (
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  )}
                  <span className="font-medium">{option.text}</span>
                </div>
                {showResults && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{option.votes} votes</span>
                    <span>({percentage.toFixed(1)}%)</span>
                  </div>
                )}
              </div>
              {showResults && <Progress value={percentage} className="h-2" />}
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
            {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"} total
          </div>

          {canVote && selectedOptions.length > 0 && (
            <Button onClick={handleVote} disabled={isVoting} size="sm">
              {isVoting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Voting...</span>
                </div>
              ) : (
                "Submit Vote"
              )}
            </Button>
          )}

          {hasVoted && (
            <Badge variant="outline" className="text-green-600">
              ✓ Voted
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
