import { createClient } from "@/lib/supabase/client";
import { Poll, CreatePollData, Vote, PollOption } from "@/lib/types";

const supabase = createClient();

export interface PollWithDetails extends Omit<Poll, "options" | "creator"> {
  poll_options: PollOption[];
  user_profiles: {
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  user_votes?: Vote[];
}

export const pollsApi = {
  // Create a new poll
  async createPoll(pollData: CreatePollData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Insert poll
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          title: pollData.title,
          description: pollData.description || null,
          creator_id: user.id,
          is_public: pollData.isPublic ?? true,
          allow_multiple_votes: pollData.allowMultipleVotes ?? false,
          allow_add_options: pollData.allowAddOptions ?? false,
          expires_at: pollData.expiresAt
            ? new Date(pollData.expiresAt).toISOString()
            : null,
        })
        .select()
        .single();

      if (pollError) {
        throw new Error(pollError.message);
      }

      // Insert poll options
      const optionInserts = pollData.options.map((text) => ({
        poll_id: poll.id,
        text,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionInserts);

      if (optionsError) {
        // Clean up poll if options insert fails
        await supabase.from("polls").delete().eq("id", poll.id);
        throw new Error(optionsError.message);
      }

      // Fetch the complete poll with options
      return this.getPollById(poll.id);
    } catch (error) {
      throw new Error(
        `Failed to create poll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Get poll by ID with all details
  async getPollById(pollId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("polls")
        .select(
          `
          *,
          poll_options (*)
        `,
        )
        .eq("id", pollId)
        .single();

      const { data: poll, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      if (!poll) {
        throw new Error("Poll not found");
      }

      // Get user's votes if authenticated
      let userVotes: Vote[] = [];
      if (user) {
        const { data: votes } = await supabase
          .from("votes")
          .select("*")
          .eq("poll_id", pollId)
          .eq("user_id", user.id);

        userVotes = votes || [];
      }

      // Get creator email from auth.users (requires service role, so we'll handle gracefully)
      let creatorUsername = "Unknown User";
      try {
        const { data: userData } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", poll.creator_id)
          .single();

        if (userData?.email) {
          creatorUsername = userData.email.split("@")[0];
        }
      } catch (error) {
        // If we can't access auth.users, extract from metadata if available
        creatorUsername = `user_${poll.creator_id.slice(0, 8)}`;
      }

      // Transform to expected format
      const transformedPoll: Poll = {
        id: poll.id,
        title: poll.title,
        description: poll.description || "",
        creatorId: poll.creator_id,
        isPublic: poll.is_public,
        allowMultipleVotes: poll.allow_multiple_votes,
        allowAddOptions: poll.allow_add_options,
        expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
        createdAt: new Date(poll.created_at),
        updatedAt: new Date(poll.updated_at),
        totalVotes: poll.poll_options.reduce(
          (sum: number, option: any) => sum + option.votes_count,
          0,
        ),
        options: poll.poll_options.map((option: any) => ({
          id: option.id,
          text: option.text,
          votes: option.votes_count,
          pollId: poll.id,
        })),
        creator: {
          id: poll.creator_id,
          username: creatorUsername,
          email: "", // Not fetched for privacy
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        userVotes: userVotes,
      };

      return transformedPoll;
    } catch (error) {
      throw new Error(
        `Failed to fetch poll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Get all public polls with pagination
  async getPolls(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      isPublic?: boolean;
      creatorId?: string;
    },
  ) {
    try {
      let query = supabase
        .from("polls")
        .select(
          `
          *,
          poll_options (*)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.isPublic !== undefined) {
        query = query.eq("is_public", filters.isPublic);
      }

      if (filters?.creatorId) {
        query = query.eq("creator_id", filters.creatorId);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: polls, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Transform polls to expected format (without user_profiles table)
      const transformedPolls: Poll[] = (polls || []).map((poll: any) => {
        // Create a simple username from creator_id
        const creatorUsername = `user_${poll.creator_id.slice(0, 8)}`;

        return {
          id: poll.id,
          title: poll.title,
          description: poll.description || "",
          creatorId: poll.creator_id,
          isPublic: poll.is_public,
          allowMultipleVotes: poll.allow_multiple_votes,
          allowAddOptions: poll.allow_add_options,
          expiresAt: poll.expires_at ? new Date(poll.expires_at) : undefined,
          createdAt: new Date(poll.created_at),
          updatedAt: new Date(poll.updated_at),
          totalVotes: poll.poll_options.reduce(
            (sum: number, option: any) => sum + option.votes_count,
            0,
          ),
          options: poll.poll_options.map((option: any) => ({
            id: option.id,
            text: option.text,
            votes: option.votes_count,
            pollId: poll.id,
          })),
          creator: {
            id: poll.creator_id,
            username: creatorUsername,
            email: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      });

      return {
        polls: transformedPolls,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch polls: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Vote on a poll
  async voteOnPoll(pollId: string, optionIds: string[]) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if poll allows multiple votes
      const { data: poll } = await supabase
        .from("polls")
        .select("allow_multiple_votes, expires_at")
        .eq("id", pollId)
        .single();

      if (!poll) {
        throw new Error("Poll not found");
      }

      // Check if poll has expired
      if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
        throw new Error("This poll has expired");
      }

      // Remove existing votes if not allowing multiple votes
      if (!poll.allow_multiple_votes) {
        await supabase
          .from("votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("user_id", user.id);
      }

      // Insert new votes
      const voteInserts = optionIds.map((optionId) => ({
        user_id: user.id,
        poll_id: pollId,
        option_id: optionId,
      }));

      const { data: votes, error } = await supabase
        .from("votes")
        .upsert(voteInserts, {
          onConflict: "user_id,poll_id,option_id",
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return votes || [];
    } catch (error) {
      throw new Error(
        `Failed to vote: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Remove user's vote from a poll
  async removeVote(pollId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      throw new Error(
        `Failed to remove vote: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Add a new option to a poll (if allowed)
  async addOption(pollId: string, optionText: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if poll allows adding options
      const { data: poll } = await supabase
        .from("polls")
        .select("allow_add_options, expires_at")
        .eq("id", pollId)
        .single();

      if (!poll) {
        throw new Error("Poll not found");
      }

      if (!poll.allow_add_options) {
        throw new Error("This poll does not allow adding new options");
      }

      // Check if poll has expired
      if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
        throw new Error("This poll has expired");
      }

      // Insert new option
      const { data: option, error } = await supabase
        .from("poll_options")
        .insert({
          poll_id: pollId,
          text: optionText.trim(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return option;
    } catch (error) {
      throw new Error(
        `Failed to add option: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Get user's own polls
  async getMyPolls(page: number = 1, limit: number = 10) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      return this.getPolls(page, limit, { creatorId: user.id });
    } catch (error) {
      throw new Error(
        `Failed to fetch user polls: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Update a poll
  async updatePoll(pollId: string, updates: Partial<CreatePollData>) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: poll, error } = await supabase
        .from("polls")
        .update({
          title: updates.title,
          description: updates.description || null,
          is_public: updates.isPublic,
          allow_multiple_votes: updates.allowMultipleVotes,
          allow_add_options: updates.allowAddOptions,
          expires_at: updates.expiresAt
            ? new Date(updates.expiresAt).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pollId)
        .eq("creator_id", user.id) // Ensure user owns the poll
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!poll) {
        throw new Error(
          "Poll not found or you do not have permission to update it",
        );
      }

      // Update options if provided
      if (updates.options && updates.options.length > 0) {
        // Delete existing options
        await supabase.from("poll_options").delete().eq("poll_id", pollId);

        // Insert new options
        const optionInserts = updates.options.map((text) => ({
          poll_id: pollId,
          text,
        }));

        await supabase.from("poll_options").insert(optionInserts);
      }

      return this.getPollById(pollId);
    } catch (error) {
      throw new Error(
        `Failed to update poll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  // Delete a poll
  async deletePoll(pollId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("polls")
        .delete()
        .eq("id", pollId)
        .eq("creator_id", user.id); // Ensure user owns the poll

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete poll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
