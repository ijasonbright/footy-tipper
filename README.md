# AFL Tipper Pro

The ultimate AFL tipping competition application built with Next.js 14, TypeScript, and modern web technologies.

## 🏈 Features

- **Competition Management**: Create and join private tipping competitions
- **Smart Tipping**: Confidence points, margin predictions, multiple scoring systems
- **Live Updates**: Real-time score updates and leaderboards during AFL matches
- **Progressive Web App**: Install on mobile devices with offline support
- **Social Features**: User profiles, achievements, and expert predictions

## 🚀 Quick Start

### Prerequisites 

- Node.js 18+ and npm
- GitHub account
- Vercel account (free)
- Neon database account (free PostgreSQL)
- Clerk account (free authentication)

### 1. Setup Repository

```bash
# Clone or create new repository
git clone [your-repo-url] afl-tipper
cd afl-tipper

# Install dependencies
npm install

# Create staging branch
git checkout -b staging
git push -u origin staging
```

### 2. Environment Setup

Create accounts and get API keys:

1. **Neon Database**: Create PostgreSQL database at [neon.tech](https://neon.tech)
2. **Clerk Auth**: Setup authentication at [clerk.com](https://clerk.com)
3. **Vercel**: Connect GitHub repo at [vercel.com](https://vercel.com)

### 3. Configure Environment Variables

In Vercel dashboard, add these environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Clerk Authentication  
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: View database
npx prisma studio
```

### 5. Deploy

```bash
# Push to staging for testing
git add .
git commit -m "Initial setup"
git push origin staging

# Test on: https://afl-tipper-git-staging-[username].vercel.app

# Deploy to production
git checkout main
git merge staging  
git push origin main

# Live at: https://afl-tipper.vercel.app
```

## 🛠 Development Workflow

### Streamlined Development Process

1. **Code locally** (no local testing needed)
2. **Push to staging branch** for UAT testing
3. **Test on live staging URL**
4. **Merge to main** for production deployment

```bash
# Daily workflow
git add .
git commit -m "Add new feature"
git push origin staging

# Test on staging URL
# If working:
git checkout main
git merge staging
git push origin main
```

### Testing Strategy

- **UAT Testing**: All testing on live staging environment
- **No Local Setup**: All services (database, auth) are remote
- **Instant Deployment**: Changes visible within seconds

## 📱 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Data Source**: Squiggle AFL API

## 🏗 Project Structure

```
afl-tipper/
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # User dashboard
│   ├── competitions/  # Competition pages
│   └── (auth)/        # Auth pages
├── components/
│   ├── ui/           # Reusable UI components
│   ├── tipping/      # Tipping interface
│   └── competitions/ # Competition components
├── lib/
│   ├── squiggle.ts   # AFL API integration
│   ├── scoring.ts    # Scoring calculations
│   └── db.ts         # Database utilities
├── prisma/
│   └── schema.prisma # Database schema
└── public/           # Static assets
```

## 📊 API Integration

### Squiggle AFL API

The app integrates with the free Squiggle API for:
- Live AFL fixtures and results
- Team information and statistics
- Expert predictions and models

### Key Endpoints

- `GET /api/games` - Current round fixtures
- `POST /api/tips` - Submit user tips
- `GET /api/competitions` - User competitions
- `GET /api/leaderboards` - Competition standings

## 🔧 Configuration

### Scoring Systems

Configurable scoring options:
- Standard (1 point per correct tip)
- Confidence (multiply by confidence ranking)
- Margin bonus (bonus for close margin predictions)

### Competition Settings

- Private/public competitions
- Custom scoring rules
- Round-by-round or season-long
- Member management

## 🚀 Deployment

### Automatic Deployment

- **Staging**: Push to `staging` branch → staging URL
- **Production**: Push to `main` branch → production URL

### Custom Domains

Configure custom domain in Vercel:
1. Add domain in Vercel dashboard
2. Update DNS settings
3. SSL automatically configured

## 📈 Monitoring

### Built-in Analytics

- Vercel Analytics (automatic)
- Real-time performance monitoring
- Error tracking and logging

### Database Monitoring

- Neon dashboard for database metrics
- Query performance tracking
- Connection pooling statistics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch from `staging`
3. Make changes and test on staging URL
4. Submit pull request to `staging`

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and support:
1. Check the documentation
2. Search existing GitHub issues
3. Create new issue with reproduction steps

---

**Ready to start tipping? Let's go! 🏈**
# Manual webhook test Sat 27 Sep 2025 08:59:04 AEST
