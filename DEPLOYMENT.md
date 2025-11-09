# VolunteerHub Deployment Guide

## Overview
This guide covers deploying the VolunteerHub application to production.

## Prerequisites
- Node.js 18+ installed
- Supabase account with a project set up
- Environment variables configured

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Production URL
VITE_APP_URL=https://volunteerhub.xyz
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:8080

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Preview the production build locally:
```bash
npm run preview
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in the [Vercel Dashboard](https://vercel.com/dashboard)
3. Configure environment variables in Vercel project settings
4. Deploy!

Vercel will automatically:
- Build your application on each push to main
- Provide HTTPS with Let's Encrypt
- Handle custom domains

### Option 2: Netlify

1. Push your code to GitHub
2. Import your repository in [Netlify](https://app.netlify.com)
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Netlify project settings
5. Deploy!

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. Build the application:
```bash
npm run build
```

2. Upload the `dist` folder to your server

3. Set up a web server (Nginx):
```nginx
server {
    listen 80;
    server_name volunteerhub.xyz www.volunteerhub.xyz;
    root /path/to/volunteerhub/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

4. Install SSL certificate with Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d volunteerhub.xyz -d www.volunteerhub.xyz
```

## Security Checklist

- [x] Environment variables are not committed to version control
- [x] HTTPS is enabled in production
- [x] Console logs are removed from production builds
- [x] Error boundaries are implemented
- [x] Input validation is in place
- [ ] Security headers are configured (TODO: Configure in hosting provider)
- [ ] Rate limiting is enabled (TODO: Configure in Supabase)
- [ ] Monitoring is set up (TODO: Integrate Sentry or similar)

## Post-Deployment

1. Verify all environment variables are correctly set
2. Test authentication flows (signup, signin, password reset)
3. Test core features (applying to opportunities, creating opportunities)
4. Monitor error logs for any issues
5. Set up automated backups for database

## Troubleshooting

### Build fails
- Ensure all environment variables are set
- Check that Node.js version is 18 or higher
- Run `npm install` to ensure all dependencies are installed

### Authentication not working
- Verify Supabase environment variables are correct
- Check Supabase project settings for allowed redirect URLs
- Ensure email verification is properly configured in Supabase

### Database connection errors
- Verify Supabase URL and anon key are correct
- Check Supabase project status in dashboard
- Ensure network firewall allows connections to Supabase

## Support

For issues or questions, please contact the development team.

