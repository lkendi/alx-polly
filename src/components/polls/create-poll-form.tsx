'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface CreatePollFormProps {
  onSubmit?: (data: {
    title: string;
    description: string;
    options: string[];
    isPublic: boolean;
    allowMultipleVotes: boolean;
    allowAddOptions: boolean;
    expiresAt?: string;
  }) => void;
  isLoading?: boolean;
  error?: string;
  initialData?: {
    title?: string;
    description?: string;
    options?: string[];
    isPublic?: boolean;
    allowMultipleVotes?: boolean;
    allowAddOptions?: boolean;
    expiresAt?: string;
  };
}

export function CreatePollForm({
  onSubmit,
  isLoading = false,
  error,
  initialData
}: CreatePollFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [options, setOptions] = useState<string[]>(
    initialData?.options || ['', '']
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(
    initialData?.allowMultipleVotes ?? false
  );
  const [allowAddOptions, setAllowAddOptions] = useState(
    initialData?.allowAddOptions ?? false
  );
  const [expiresAt, setExpiresAt] = useState(initialData?.expiresAt || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Poll title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Options validation
    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }

    const duplicateOptions = validOptions.filter((option, index) =>
      validOptions.indexOf(option) !== index
    );
    if (duplicateOptions.length > 0) {
      newErrors.options = 'All options must be unique';
    }

    validOptions.forEach((option, index) => {
      if (option.length > 200) {
        newErrors[`option_${index}`] = 'Option must be less than 200 characters';
      }
    });

    // Expiry date validation
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      const now = new Date();

      if (expiryDate <= now) {
        newErrors.expiresAt = 'Expiry date must be in the future';
      }

      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      if (expiryDate > maxDate) {
        newErrors.expiresAt = 'Expiry date cannot be more than 1 year from now';
      }
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Filter out empty options
    const validOptions = options.filter(option => option.trim());

    onSubmit?.({
      title: title.trim(),
      description: description.trim(),
      options: validOptions,
      isPublic,
      allowMultipleVotes,
      allowAddOptions,
      expiresAt: expiresAt || undefined,
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  const getMaxDateTime = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().slice(0, 16);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {initialData ? 'Edit Poll' : 'Create New Poll'}
        </CardTitle>
        <CardDescription>
          {initialData
            ? 'Update your poll details and options'
            : 'Create a new poll and share it with others'
          }
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Poll Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="What's your question?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={isLoading}
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {title.length}/200
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide additional context for your poll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={isLoading}
              rows={3}
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {description.length}/1000
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Poll Options *</Label>
              <Badge variant="outline">
                {options.filter(o => o.trim()).length} options
              </Badge>
            </div>

            {errors.options && (
              <p className="text-sm text-red-600">{errors.options}</p>
            )}

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className={errors[`option_${index}`] ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      disabled={isLoading}
                      maxLength={200}
                    />
                    {errors[`option_${index}`] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[`option_${index}`]}
                      </p>
                    )}
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={isLoading}
                      className="px-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                disabled={isLoading}
                className="w-full"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Another Option
              </Button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Label>Poll Settings</Label>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                  disabled={isLoading}
                />
                <div>
                  <Label htmlFor="isPublic" className="font-normal">
                    Public poll
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone can view and vote on this poll
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowMultipleVotes"
                  checked={allowMultipleVotes}
                  onCheckedChange={(checked) => setAllowMultipleVotes(checked as boolean)}
                  disabled={isLoading}
                />
                <div>
                  <Label htmlFor="allowMultipleVotes" className="font-normal">
                    Allow multiple selections
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Users can select more than one option
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowAddOptions"
                  checked={allowAddOptions}
                  onCheckedChange={(checked) => setAllowAddOptions(checked as boolean)}
                  disabled={isLoading}
                />
                <div>
                  <Label htmlFor="allowAddOptions" className="font-normal">
                    Allow users to add options
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Users can suggest new options for this poll
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Poll Expiry (optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={getMinDateTime()}
              max={getMaxDateTime()}
              className={errors.expiresAt ? 'border-red-500 focus-visible:ring-red-500' : ''}
              disabled={isLoading}
            />
            {errors.expiresAt && (
              <p className="text-sm text-red-600">{errors.expiresAt}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave blank for polls that never expire
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between space-x-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            Save as Draft
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>
                  {initialData ? 'Updating...' : 'Creating...'}
                </span>
              </div>
            ) : (
              initialData ? 'Update Poll' : 'Create Poll'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
