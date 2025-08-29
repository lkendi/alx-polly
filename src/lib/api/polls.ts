import { Poll, CreatePollData, Vote, ApiResponse, PaginatedResponse, PollFilters } from '@/lib/types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Poll API functions
export const pollsApi = {
  // Get all polls with optional filters and pagination
  async getPolls(
    filters?: PollFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Poll>>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiRequest<PaginatedResponse<Poll>>(`/polls?${searchParams.toString()}`);
  },

  // Get a single poll by ID
  async getPoll(pollId: string): Promise<ApiResponse<Poll>> {
    return apiRequest<Poll>(`/polls/${pollId}`);
  },

  // Create a new poll
  async createPoll(pollData: CreatePollData): Promise<ApiResponse<Poll>> {
    return apiRequest<Poll>('/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  },

  // Update an existing poll
  async updatePoll(pollId: string, pollData: Partial<CreatePollData>): Promise<ApiResponse<Poll>> {
    return apiRequest<Poll>(`/polls/${pollId}`, {
      method: 'PUT',
      body: JSON.stringify(pollData),
    });
  },

  // Delete a poll
  async deletePoll(pollId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/polls/${pollId}`, {
      method: 'DELETE',
    });
  },

  // Vote on a poll
  async voteOnPoll(pollId: string, optionIds: string[]): Promise<ApiResponse<Vote[]>> {
    return apiRequest<Vote[]>(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIds }),
    });
  },

  // Remove vote from a poll
  async removeVote(pollId: string): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/polls/${pollId}/vote`, {
      method: 'DELETE',
    });
  },

  // Add option to a poll (if allowed)
  async addOption(pollId: string, optionText: string): Promise<ApiResponse<Poll>> {
    return apiRequest<Poll>(`/polls/${pollId}/options`, {
      method: 'POST',
      body: JSON.stringify({ text: optionText }),
    });
  },

  // Get user's own polls
  async getMyPolls(page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<Poll>>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return apiRequest<PaginatedResponse<Poll>>(`/polls/my?${searchParams.toString()}`);
  },

  // Get polls the user has voted on
  async getVotedPolls(page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<Poll>>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return apiRequest<PaginatedResponse<Poll>>(`/polls/voted?${searchParams.toString()}`);
  },

  // Get poll analytics/statistics
  async getPollAnalytics(pollId: string): Promise<ApiResponse<{
    totalVotes: number;
    uniqueVoters: number;
    votesPerOption: Record<string, number>;
    votesOverTime: { date: string; votes: number }[];
    demographicBreakdown?: Record<string, any>;
  }>> {
    return apiRequest(`/polls/${pollId}/analytics`);
  },

  // Search polls
  async searchPolls(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Poll>>> {
    const searchParams = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
    });

    return apiRequest<PaginatedResponse<Poll>>(`/polls/search?${searchParams.toString()}`);
  },

  // Get trending polls
  async getTrendingPolls(
    timeframe: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<ApiResponse<Poll[]>> {
    const searchParams = new URLSearchParams({
      timeframe,
      limit: limit.toString(),
    });

    return apiRequest<Poll[]>(`/polls/trending?${searchParams.toString()}`);
  },

  // Get poll recommendations for user
  async getRecommendedPolls(limit: number = 10): Promise<ApiResponse<Poll[]>> {
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
    });

    return apiRequest<Poll[]>(`/polls/recommended?${searchParams.toString()}`);
  },

  // Report a poll
  async reportPoll(
    pollId: string,
    reason: string,
    description?: string
  ): Promise<ApiResponse<void>> {
    return apiRequest<void>(`/polls/${pollId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  },

  // Duplicate a poll
  async duplicatePoll(pollId: string): Promise<ApiResponse<Poll>> {
    return apiRequest<Poll>(`/polls/${pollId}/duplicate`, {
      method: 'POST',
    });
  },

  // Share poll (get shareable link)
  async sharePoll(pollId: string): Promise<ApiResponse<{ shareUrl: string; shareCode: string }>> {
    return apiRequest(`/polls/${pollId}/share`, {
      method: 'POST',
    });
  },

  // Get poll by share code
  async getPollByShareCode(shareCode: string): Promise<ApiResponse<Poll>> {
    return apiRequest<Poll>(`/polls/shared/${shareCode}`);
  },

  // Export poll results
  async exportPollResults(
    pollId: string,
    format: 'csv' | 'json' | 'pdf' = 'csv'
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiRequest(`/polls/${pollId}/export?format=${format}`);
  },
};

// Mock API functions for development/demo
export const mockPollsApi = {
  async getPolls(): Promise<ApiResponse<PaginatedResponse<Poll>>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        data: [], // Add mock poll data here
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
    };
  },

  async createPoll(pollData: CreatePollData): Promise<ApiResponse<Poll>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful creation
    const mockPoll: Poll = {
      id: `poll_${Date.now()}`,
      title: pollData.title,
      description: pollData.description,
      options: pollData.options.map((text, index) => ({
        id: `option_${index}`,
        text,
        votes: 0,
        pollId: `poll_${Date.now()}`,
      })),
      creator: {
        id: 'demo-user',
        username: 'demo',
        email: 'demo@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      creatorId: 'demo-user',
      isPublic: pollData.isPublic ?? true,
      allowMultipleVotes: pollData.allowMultipleVotes ?? false,
      allowAddOptions: pollData.allowAddOptions ?? false,
      expiresAt: pollData.expiresAt ? new Date(pollData.expiresAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalVotes: 0,
    };

    return {
      success: true,
      data: mockPoll,
    };
  },

  async voteOnPoll(pollId: string, optionIds: string[]): Promise<ApiResponse<Vote[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockVotes: Vote[] = optionIds.map((optionId, index) => ({
      id: `vote_${Date.now()}_${index}`,
      userId: 'demo-user',
      pollId,
      optionId,
      createdAt: new Date(),
    }));

    return {
      success: true,
      data: mockVotes,
    };
  },
};
