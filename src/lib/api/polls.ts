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
};
