.# Davomat Tizimi

An attendance management system built with Next.js and Supabase.

## Environment Variables

Before deploying or running the application, make sure to set up the following environment variables:

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Environment Variables

- `GOOGLE_MAPS_API_KEY`: Google Maps API key (if using location features, accessed only on server)

## Deployment on Netlify

When deploying to Netlify, make sure to add the required environment variables in the Netlify dashboard:

1. Go to your site settings in Netlify
2. Navigate to "Environment variables"
3. Add the required environment variables listed above

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your environment variables
3. Install dependencies: `npm install` or `pnpm install`
4. Run the development server: `npm run dev` or `pnpm dev`

\`\`\`

Now, let's create a server API route to access the Google Maps API key securely:
