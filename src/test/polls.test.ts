import { pollsApi } from '@/lib/api/polls';
import { createClient } from '@/lib/supabase/client';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  })),
}));

describe('pollsApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = { id: 'test-user-id' };
  const mockPoll = { id: 'test-poll-id', title: 'Test Poll', creator_id: 'test-user-id', is_public: true, allow_multiple_votes: false, allow_add_options: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
  const mockOption = { id: 'test-option-id', text: 'Test Option', poll_id: 'test-poll-id', votes_count: 0};


  describe('createPoll', () => {
    it('should create a poll successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn((table: string) => ({
          insert: jest.fn().mockResolvedValueOnce({ data: [mockPoll], error: null }),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).insert = jest.fn().mockResolvedValueOnce({ data: [mockOption], error: null });

      const pollData = { title: 'Test Poll', options: ['Option 1', 'Option 2'] };
      const result = await pollsApi.createPoll(pollData);

      expect(result).toBeDefined();
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle poll creation errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn((table: string) => ({
          insert: jest.fn().mockResolvedValueOnce({ data: [], error: new Error('Insert error') }),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).insert = jest.fn().mockResolvedValueOnce({ data: [], error: new Error('Insert error') });

      const pollData = { title: 'Test Poll', options: ['Option 1', 'Option 2'] };

      await expect(pollsApi.createPoll(pollData)).rejects.toThrow('Failed to create poll: Insert error');
    });
  });

  describe('getPollById', () => {
    it('should retrieve a poll by ID successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: [mockPoll], error: null }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).select = jest.fn().mockResolvedValueOnce({ data: [mockOption], error: null });

      const pollId = 'test-poll-id';
      const result = await pollsApi.getPollById(pollId);

      expect(result).toBeDefined();
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle getPollById errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: [], error: new Error('Select error') }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).select = jest.fn().mockResolvedValueOnce({ data: [], error: new Error('Select error') });


      const pollId = 'test-poll-id';

      await expect(pollsApi.getPollById(pollId)).rejects.toThrow('Failed to fetch poll: Select error');
    });
  });

  describe('getPolls', () => {
    it('should retrieve polls successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: [mockPoll], count: 1, error: null }),
          range: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).select = jest.fn().mockResolvedValueOnce({ data: [mockOption], error: null });


      const page = 1;
      const limit = 10;
      const filters = { isPublic: true, search: 'test' };

      const result = await pollsApi.getPolls(page, limit, filters);

      expect(result).toBeDefined();
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle getPolls errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: [], count: 0, error: new Error('Select error') }),
          range: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).select = jest.fn().mockResolvedValueOnce({ data: [], error: new Error('Select error') });


      const page = 1;
      const limit = 10;
      const filters = { isPublic: true, search: 'test' };

      await expect(pollsApi.getPolls(page, limit, filters)).rejects.toThrow('Failed to fetch polls: Select error');
    });
  });

  describe('voteOnPoll', () => {
    it('should vote on a poll successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: {allow_multiple_votes: false, expires_at:null}, error: null }),
          delete: jest.fn().mockResolvedValueOnce({ error: null }),
          upsert: jest.fn().mockResolvedValueOnce({ data: [], error: null }),
          eq: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';
      const optionIds = ['option1', 'option2'];

      const result = await pollsApi.voteOnPoll(pollId, optionIds);

      expect(result).toBeDefined();
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle voteOnPoll errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: {allow_multiple_votes: false, expires_at:null}, error: null }),
          delete: jest.fn().mockResolvedValueOnce({ error: null }),
          upsert: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Upsert error') }),
          eq: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';
      const optionIds = ['option1', 'option2'];

      await expect(pollsApi.voteOnPoll(pollId, optionIds)).rejects.toThrow('Failed to vote: Upsert error');
    });
  });

  describe('removeVote', () => {
    it('should remove a vote successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          delete: jest.fn().mockResolvedValueOnce({ error: null }),
          eq: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';

      const result = await pollsApi.removeVote(pollId);

      expect(result).toBe(true);
      expect(createClient().from).toHaveBeenCalledWith('votes');
    });

    it('should handle removeVote errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          delete: jest.fn().mockResolvedValueOnce({ error: new Error('Delete error') }),
          eq: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';

      await expect(pollsApi.removeVote(pollId)).rejects.toThrow('Failed to remove vote: Delete error');
    });
  });

  describe('addOption', () => {
    it('should add a poll option successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: {allow_add_options: true, expires_at: null}, error: null }),
          insert: jest.fn().mockResolvedValueOnce({ data: [mockOption], error: null }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';
      const optionText = 'test-option-text';

      const result = await pollsApi.addOption(pollId, optionText);

      expect(result).toBeDefined();
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle addOption errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: {allow_add_options: true, expires_at: null}, error: null }),
          insert: jest.fn().mockResolvedValueOnce({ data: null, error: new Error('Insert error') }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';
      const optionText = 'test-option-text';

      await expect(pollsApi.addOption(pollId, optionText)).rejects.toThrow('Failed to add option: Insert error');
    });
  });

  describe('getMyPolls', () => {
    it('should get my polls successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: [mockPoll], count: 1, error: null }),
          range: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).select = jest.fn().mockResolvedValueOnce({ data: [mockOption], error: null });

      const page = 1;
      const limit = 10;

      const result = await pollsApi.getMyPolls(page, limit);

      expect(result).toBeDefined();
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle getMyPolls errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          select: jest.fn().mockResolvedValueOnce({ data: [], count: 0, error: new Error('Select error') }),
          range: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
        })),
      }));
      (createClient().from('poll_options') as any).select = jest.fn().mockResolvedValueOnce({ data: [], error: new Error('Select error') });


      const page = 1;
      const limit = 10;

      await expect(pollsApi.getMyPolls(page, limit)).rejects.toThrow('Failed to fetch user polls: Select error');
    });
  });

  describe('updatePoll', () => {
    it('should update a poll successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          update: jest.fn().mockResolvedValueOnce({ data: [mockPoll], error: null }),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          delete: jest.fn().mockResolvedValueOnce({ error: null }),
          insert: jest.fn().mockResolvedValueOnce({ data: [mockOption], error: null }),
        })),
      }));

      const pollId = 'test-poll-id';
      const updates = { title: 'Updated Test Poll' };

      const result = await pollsApi.updatePoll(pollId, updates);

      expect(result).toBeDefined();
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle updatePoll errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          update: jest.fn().mockResolvedValueOnce({ data: [], error: new Error('Update error') }),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          delete: jest.fn().mockResolvedValueOnce({ error: null }),
          insert: jest.fn().mockResolvedValueOnce({ data: [mockOption], error: null }),
        })),
      }));

      const pollId = 'test-poll-id';
      const updates = { title: 'Updated Test Poll' };

      await expect(pollsApi.updatePoll(pollId, updates)).rejects.toThrow('Failed to update poll: Update error');
    });
  });

  describe('deletePoll', () => {
    it('should delete a poll successfully', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          delete: jest.fn().mockResolvedValueOnce({ error: null }),
          eq: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';

      const result = await pollsApi.deletePoll(pollId);

      expect(result).toBe(true);
      expect(createClient().from).toHaveBeenCalledWith('polls');
    });

    it('should handle deletePoll errors', async () => {
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValueOnce({ data: { user: mockUser }, error: null }),
        },
        from: jest.fn(() => ({
          delete: jest.fn().mockResolvedValueOnce({ error: new Error('Delete error') }),
          eq: jest.fn().mockReturnThis(),
        })),
      }));

      const pollId = 'test-poll-id';

      await expect(pollsApi.deletePoll(pollId)).rejects.toThrow('Failed to delete poll: Delete error');
    });
  });
});
