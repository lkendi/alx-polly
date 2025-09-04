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

      const createdPoll = poll?.data;
      if (!createdPoll) {
        throw new Error("Failed to create poll: No poll data returned");
      }

      // Insert poll options
      const optionInserts = pollData.options.map((text) => ({
        poll_id: createdPoll.id,
        text,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionInserts);

      if (optionsError) {
        // Clean up poll if options insert fails
        await supabase.from("polls").delete().eq("id", createdPoll.id);
        throw new Error(optionsError.message);
      }

      // Fetch the complete poll with options
      return this.getPollById(createdPoll.id);
    } catch (error) {
      throw new Error(
        `Failed to create poll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },

  addOption(pollId: string, optionText: string): Promise<any> {
    // Example implementation, replace with your actual API call
    return fetch(`/api/polls/${pollId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: optionText }),
    }).then(res => {
      if (!res.ok) throw new Error("Failed to add option");
      return res.json();
    });
  },


  voteOnPoll(pollId: string, selectedOptions: string[]): Promise<any> {
    // TODO: Implement the API call to submit votes for a poll
    // Example:
    // return fetch(`/api/polls/${pollId}/vote`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ options: selectedOptions }),
    // }).then(res => res.json());
    throw new Error("voteOnPoll not implemented");
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

      return poll;
    } catch (error) {
      throw new Error(
        `Failed to fetch poll: ${error instanceof Error ? error.message : "Unknown error"}`,
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
            *,\n            poll_options (*)\n          `,
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

      if (!polls) {
        throw new Error("No polls found");
      }

      return {
        polls,
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
  // Update a poll
  async updatePoll(pollId: string, pollData: CreatePollData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Only allow update if user owns the poll
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .select("creator_id")
        .eq("id", pollId)
        .single();

      if (pollError) {
        throw new Error(pollError.message);
      }
      if (!poll || poll.creator_id !== user.id) {
        throw new Error("You do not have permission to update this poll.");
      }

      // Update poll fields
      const { error: updateError } = await supabase
        .from("polls")
        .update({
          title: pollData.title,
          description: pollData.description || null,
          is_public: pollData.isPublic ?? true,
          allow_multiple_votes: pollData.allowMultipleVotes ?? false,
          allow_add_options: pollData.allowAddOptions ?? false,
          expires_at: pollData.expiresAt
            ? new Date(pollData.expiresAt).toISOString()
            : null,
        })
        .eq("id", pollId)
        .eq("creator_id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update poll options (delete old and insert new)
      // For simplicity, remove all options and re-insert
      await supabase.from("poll_options").delete().eq("poll_id", pollId);
      const optionInserts = pollData.options.map((text) => ({
        poll_id: pollId,
        text,
      }));
      if (optionInserts.length > 0) {
        const { error: optionsError } = await supabase
          .from("poll_options")
          .insert(optionInserts);
        if (optionsError) {
          throw new Error(optionsError.message);
        }
      }

      // Return updated poll
      return this.getPollById(pollId);
    } catch (error) {
      throw new Error(
        `Failed to update poll: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
};
