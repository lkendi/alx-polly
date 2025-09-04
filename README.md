# Polly - Interactive Polling Platform

A modern polling application built with Next.js 15, TypeScript, and Shadcn/ui components. Create, share, and vote on polls with real-time results and analytics.

## Features

- 🗳️ Create and manage polls with multiple options
- 📊 Real-time voting and results visualization
- 👤 User authentication and profiles
- 📱 Responsive design for all devices
- 🎨 Modern UI with Shadcn/ui components
- 🔒 Private and public poll options
- ⚙️ Poll settings (multiple choice, expiry dates, etc.)
- 📈 Basic analytics and statistics
- 🚀 Built with Next.js 15 and TypeScript

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React (via Shadcn/ui)
- **State Management**: React Context + Hooks
- **Authentication**: Supabase Auth with OAuth support
- **Database**: Supabase (PostgreSQL)

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx       # Login page
│   │   └── register/page.tsx    # Registration page
│   ├── dashboard/               # User dashboard
│   │   └── page.tsx            # Dashboard overview
│   ├── polls/                   # Poll-related pages
│   │   ├── create/page.tsx     # Create new poll
│   │   └── page.tsx            # Browse polls
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Home page (redirects to /polls)
├── components/                  # React components
│   ├── auth/                   # Authentication components
│   │   ├── login-form.tsx      # Login form component
│   │   └── register-form.tsx   # Registration form component
│   ├── layout/                 # Layout components
│   │   ├── header.tsx          # Main navigation header
│   │   └── sidebar.tsx         # Dashboard sidebar
│   ├── polls/                  # Poll-related components
│   │   ├── create-poll-form.tsx # Poll creation form
│   │   └── poll-card.tsx       # Poll display component
│   └── ui/                     # Shadcn/ui components
│       ├── button.tsx          # Button component
│       ├── card.tsx            # Card component
│       ├── input.tsx           # Input component
│       └── ... (other UI components)
├── lib/                        # Utility libraries
│   ├── api/                    # API functions
│   │   ├── auth.ts            # Authentication API
│   │   └── polls.ts           # Poll API functions
│   ├── hooks/                  # Custom React hooks
│   │   └── useAuth.ts         # Authentication hook
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts           # Main type definitions
│   └── utils.ts               # Utility functions
└── ... (config files)
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alx-polly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Current Features

### Authentication
- ✅ Login and registration forms with validation
- ✅ Supabase authentication integration
- ✅ OAuth support (Google, GitHub)
- ✅ Protected routes and authentication context
- ✅ Email verification and password reset
- ✅ User profile management with metadata

### Polls
- ✅ Browse polls with search and filtering
- ✅ Create new polls with multiple options
- ✅ Poll settings (public/private, multiple choice, expiry)
- ✅ Vote on polls with real-time UI updates
- ✅ Poll analytics and statistics display

### Dashboard
- ✅ User dashboard with statistics
- ✅ Recent activity tracking
- ✅ Quick action buttons
- ✅ Progress tracking and achievements

### UI/UX
- ✅ Responsive design for mobile and desktop
- ✅ Modern UI with Shadcn/ui components
- ✅ Loading states and error handling
- ✅ Accessible components and navigation
- ✅ Server-side authentication with middleware
- ✅ Row Level Security (RLS) ready database schema

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)

### Quick Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd alx-polly
   npm install
   ```

2. **Set up Supabase**
   - Follow the detailed [Supabase Setup Guide](./SUPABASE_SETUP.md)
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Visit the app**
   Open [http://localhost:3000](http://localhost:3000) and create your account!

## Development Notes

### Authentication
The app uses Supabase Auth with the following features:
- Email/password authentication
- OAuth providers (Google, GitHub)
- Email verification and password reset
- Server-side auth with middleware protection
- Automatic user profile creation

### Database Integration
The project uses Supabase for backend services:
- PostgreSQL database with Row Level Security
- Real-time subscriptions ready
- Automatic API generation
- Built-in authentication and user management
- Ready-to-use database schema for polls and votes

### Component Architecture
- Reusable UI components with Shadcn/ui
- Separation of concerns with dedicated folders
- TypeScript for type safety
- Props interfaces for all components

## Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Use Tailwind classes for component styling
- Customize Shadcn/ui theme in `components.json`

### Components
- All UI components are in `src/components/ui/`
- Business logic components are organized by feature
- Easy to extend and customize

### Types
- All TypeScript types are defined in `src/lib/types/`
- Comprehensive type coverage for API responses
- Easy to extend for new features

## Next Steps for Production

1. **Database Setup**
   - Run the SQL schema from the Supabase Setup Guide
   - Configure Row Level Security policies
   - Set up database backups and monitoring

2. **Real-time Features**
   - Implement Supabase real-time subscriptions
   - Live poll updates and vote counting
   - Real-time notifications system

3. **Advanced Features**
   - File uploads with Supabase Storage
   - Social sharing integration
   - Advanced analytics dashboard
   - Email notifications with custom SMTP
   - Poll templates and categories

4. **Performance & Security**
   - Implement caching with Supabase Edge Functions
   - Add loading skeletons and optimistic updates
   - Set up rate limiting and abuse prevention
   - Configure CORS and security headers

5. **Testing & Deployment**
   - Add unit tests with Jest and Testing Library
   - Integration tests with Supabase local development
   - E2E tests with Playwright
   - Set up CI/CD with Vercel or Netlify
   - Configure environment variables for production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Security Vulnerabilities & Fixes

### 1. Input Validation & XSS Protection
- **Issue:** User-generated content was not sanitized, risking XSS.
- **Fix:** All poll questions, options, and comments are now sanitized before rendering using DOMPurify. React components escape output by default, but additional checks were added.

### 2. Authorization & IDOR
- **Issue:** Insufficient checks could allow users to access or modify resources they do not own.
- **Fix:** All API endpoints and client logic now verify resource ownership before allowing updates or deletes. Supabase Row Level Security (RLS) policies were reviewed and enforced.

### 3. CSRF Protection
- **Issue:** State-changing requests were not protected against CSRF.
- **Fix:** CSRF tokens are now required for all server-side state-changing endpoints. Supabase RLS ensures only authenticated users can perform actions.

### 4. Sensitive Data Exposure
- **Issue:** Supabase anon key was exposed in client code.
- **Fix:** Anon key permissions were restricted in Supabase dashboard. Service role keys are never exposed in client code.

### 5. CORS & Security Headers
- **Issue:** CORS and security headers were not strictly configured.
- **Fix:** CORS policies were set to allow only trusted origins. Security headers (Content-Security-Policy, X-Frame-Options, etc.) were added via Next.js middleware.

### 6. Rate Limiting & Abuse Prevention
- **Issue:** No rate limiting on critical endpoints.
- **Fix:** Rate limiting middleware was added to API routes to prevent abuse.

### 7. Error Handling
- **Issue:** Unhandled errors could leak sensitive information.
- **Fix:** Error handling was standardized. API responses are now generic, and detailed errors are logged server-side only.

---

## Change Log (Security Fixes)

- Sanitized all user-generated content before rendering.
- Enforced resource ownership checks in all API endpoints.
- Added CSRF protection for state-changing requests.
- Restricted Supabase anon key permissions.
- Configured strict CORS and added security headers.
- Implemented rate limiting on API endpoints.
- Standardized error handling to prevent information leakage.

---