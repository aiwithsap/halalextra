# HalalExtra - Railway Deployment Guide

## 📋 Project Overview

HalalExtra is a full-stack halal certification web application built with:
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Neon/Railway)
- **Auth**: Passport.js with sessions
- **File Upload**: Multer
- **Email**: Nodemailer
- **Deployment**: Railway.app

## 🚀 Railway Deployment Setup

### Required Services on Railway

1. **Web Service** (Main Application)
   - Source: Your GitHub repository
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Port: Auto-detected from `process.env.PORT`

2. **PostgreSQL Database**
   - Use Railway's PostgreSQL plugin
   - Automatically provides `DATABASE_URL` environment variable

### Environment Variables Setup

Configure these environment variables in your Railway project:

#### Required Variables
```bash
# Database (Auto-provided by Railway PostgreSQL service)
DATABASE_URL=postgresql://username:password@host:port/dbname

# Session Security
SESSION_SECRET=your-super-secure-session-secret-here

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_PATH=/tmp/uploads

# Application Settings
NODE_ENV=production
```

#### Optional Variables
```bash
# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100

# CORS Settings (if needed for external domains)
ALLOWED_ORIGINS=https://your-domain.com
```

### Deployment Steps

1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Railway Setup**
   - Connect your GitHub repository to Railway
   - Add PostgreSQL service to your project
   - Configure environment variables in Railway dashboard
   - Deploy the application

3. **Database Migration**
   ```bash
   # Run database migrations after first deployment
   npm run db:push
   ```

### Post-Deployment Checklist

- [ ] Database connection successful
- [ ] Authentication working (login/logout)
- [ ] File uploads functioning
- [ ] Email notifications (if configured)
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build application
npm run build

# Production start
npm start

# Type checking
npm run check

# Database migration
npm run db:push
```

## 📁 Project Structure

```
HalalExtra/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utility functions
│   │   └── locales/        # i18n translations
│   └── index.html
├── server/                 # Express backend
│   ├── index.ts            # Main server file
│   ├── routes.ts           # API routes
│   ├── auth.ts             # Authentication
│   ├── db.ts               # Database config
│   ├── email.ts            # Email service
│   ├── storage.ts          # File storage
│   └── utils.ts            # Utilities
├── shared/                 # Shared types/schemas
│   └── schema.ts           # Database schema
├── Dockerfile              # Docker configuration
├── railway.toml            # Railway configuration
└── package.json
```

## 🔒 Security Features

- Session-based authentication with secure cookies
- CSRF protection through same-origin policy
- File upload validation and sanitization
- SQL injection protection via Drizzle ORM
- Rate limiting on API endpoints
- Environment variable security

## 🌍 Multi-language Support

The application supports multiple languages:
- English (en)
- Arabic (ar)
- Urdu (ur)
- Hindi (hi)
- Bengali (bn)

## 📧 Email Configuration

For email notifications, configure SMTP settings:

### Gmail Example
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password  # Use App Password, not regular password
```

### Other Providers
- **Outlook**: smtp.office365.com:587
- **SendGrid**: smtp.sendgrid.net:587
- **AWS SES**: email-smtp.region.amazonaws.com:587

## 🔍 Monitoring & Logs

Railway provides built-in monitoring. Key metrics to watch:
- Response times
- Error rates
- Database connection health
- Memory usage
- CPU usage

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify `DATABASE_URL` is set correctly
   - Check PostgreSQL service is running
   - Ensure database schema is migrated

2. **Port Binding Error**
   - Railway automatically sets `PORT` environment variable
   - Application uses `process.env.PORT || 3000`

3. **File Upload Issues**
   - Railway uses ephemeral storage
   - Files uploaded to `/tmp` may be lost on restart
   - Consider using external storage (AWS S3, Cloudinary)

4. **Session Issues**
   - Ensure `SESSION_SECRET` is set
   - Check cookie settings for HTTPS in production

### Debug Commands
```bash
# Check environment variables
echo $DATABASE_URL
echo $SESSION_SECRET

# Test database connection
npm run db:push

# Check application logs
railway logs
```

## 🔄 CI/CD Pipeline

Railway automatically deploys on git push to main branch:
1. Detects changes in repository
2. Builds application (`npm run build`)
3. Runs startup command (`npm start`)
4. Health checks and deployment verification

## 📞 Support

For deployment issues:
1. Check Railway documentation
2. Review application logs in Railway dashboard
3. Verify environment variables are correctly set
4. Test database connectivity

# Transport Changes to Railway.com
I want you to use the Railway GraphQL API directly to read the logs and suggest corrections. I dont want to run that script myself. The whole point of this integration is that I dont have to copy paste railway.com logs for you. After pushing changes, wait for 4 minutes before you start using the Railway GraphQL API to check for issues. If issues are found, diagnose and suggest solutions promptly. 

---

**Last Updated**: January 2025
**Railway Version**: Latest
**Node.js Version**: 18+