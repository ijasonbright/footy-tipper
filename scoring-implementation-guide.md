# AFL Tipping Scoring & Leaderboard Implementation Guide

## Overview
You need to implement automatic score calculation for your AFL tipping competition. Here's the complete system:

## 📁 Files to Create/Update

### 1. Enhanced Scoring System
**File:** `lib/enhanced-scoring-system.ts`
- Copy from: `/mnt/user-data/outputs/enhanced-scoring-system.ts`
- Contains all scoring logic, competition settings, and leaderboard calculations

### 2. Leaderboard API Endpoint
**File:** `app/api/competitions/[id]/leaderboard/route.ts`
- Copy from: `/mnt/user-data/outputs/leaderboard-api.ts`
- API to calculate and return leaderboard data

### 3. Enhanced Leaderboard Component
**File:** `components/enhanced-leaderboard.tsx`
- Copy from: `/mnt/user-data/outputs/enhanced-leaderboard-component.tsx`
- Replace your current leaderboard with this enhanced version

### 4. Score Calculation Service
**File:** `lib/score-calculation-service.ts`
- Copy from: `/mnt/user-data/outputs/score-calculation-service.ts`
- Automatically recalculates scores when games complete

## 🔧 Database Schema Updates

You'll need to update your Prisma schema to include the `points` field in tips:

```prisma
model Tip {
  id               String   @id @default(cuid())
  userId           String
  gameId           String
  competitionId    String
  predictedWinner  Int
  margin           Int?
  confidence       Int?
  points           Int      @default(0)  // Add this line
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // ... rest of your fields
}
```

Run migration:
```bash
npx prisma db push
```

## ⚙️ Competition Settings

The system supports these configurable settings:

```typescript
interface CompetitionSettings {
  // Basic scoring
  correctTipPoints: number           // Default: 1 point per correct tip
  
  // All correct bonus
  allCorrectBonus: boolean          // Default: false
  allCorrectBonusPoints: number     // Default: 0
  
  // Margin predictions
  marginMode: 'none' | 'all' | 'first'  // Default: 'none'
  marginBonusEnabled: boolean       // Default: false
  marginBonusThreshold: number      // Default: 10
  marginBonusPoints: number         // Default: 1
  
  // Confidence system
  confidenceEnabled: boolean        // Default: false
  confidenceMultiplier: number      // Default: 1
}
```

## 📊 How Scoring Works

### 1. Basic Points
- **Correct tip**: User gets `correctTipPoints` (default: 1)
- **Incorrect tip**: 0 points

### 2. All Correct Bonus
- If `allCorrectBonus` is enabled
- User gets bonus points if they get ALL tips correct in a round
- Adds `allCorrectBonusPoints` to their round total

### 3. Margin Bonus
- If `marginBonusEnabled` is true
- User gets bonus if their margin prediction is within `marginBonusThreshold`
- Adds `marginBonusPoints` to their score

### 4. Confidence Multiplier
- If `confidenceEnabled` is true
- Points are multiplied by the confidence ranking (1-9)

### 5. Leaderboard Ranking
Sorted by:
1. **Total Points** (highest first)
2. **Total Margin Difference** (lowest first) - for tiebreaking
3. **Percentage** (highest first)

## 🚀 Quick Implementation Steps

### Step 1: Add the Files
```bash
# Copy all 4 files to your project using the paths above
```

### Step 2: Update Database
```bash
npx prisma db push
```

### Step 3: Update Your Competition Page
```tsx
// In your competition page, replace the leaderboard tab content:
import { EnhancedLeaderboard } from '@/components/enhanced-leaderboard'

// In your leaderboard tab:
<EnhancedLeaderboard 
  competitionId={competitionId}
  currentRound={currentRound}
  isAdmin={isAdmin}
/>
```

### Step 4: Auto-Calculate Scores
Add this to your game completion handler:

```typescript
import { onGameCompleted } from '@/lib/score-calculation-service'

// Call this whenever a game is marked as complete
await onGameCompleted(gameId)
```

### Step 5: Test the System
1. Create some test tips in your competitions
2. Mark some games as complete with scores
3. Check the leaderboard to see calculated results

## 🎯 Features You'll Get

### For Users:
- **Live leaderboard** with automatic score calculation
- **Round-by-round breakdown** of performance
- **Tiebreaker system** using margin accuracy
- **Visual performance indicators** (percentages, colors)

### For Admins:
- **Configurable scoring rules** per competition
- **All correct bonus** option
- **Margin prediction** modes (none/first game/all games)
- **Confidence ranking** system
- **Automatic recalculation** when settings change

## 🔄 Automatic Updates

The system will automatically:
- Calculate points when games complete
- Update leaderboard positions
- Handle tiebreakers using margin differences
- Recalculate when admin changes settings

## 📱 Mobile Responsive

The leaderboard component is fully responsive and shows:
- **Position indicators** (trophy icons for top 3)
- **User avatars** and performance stats
- **Round breakdowns** with bonus indicators
- **Settings panel** for admins

This implementation provides a complete, professional tipping competition scoring system with all the features you requested!
