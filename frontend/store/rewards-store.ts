import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tier levels
export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Tier {
  level: TierLevel;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  multiplier: number;
  benefits: string[];
  color: string;
  icon: string;
}

// Transaction types
export type TransactionType = 'earn' | 'redeem' | 'expire' | 'bonus';

export interface Transaction {
  id: string;
  type: TransactionType;
  points: number;
  description: string;
  date: string;
  orderId?: string;
  expiryDate?: string;
}

// Reward categories
export type RewardCategory = 'discount' | 'freeShipping' | 'giftCard' | 'product' | 'exclusive';

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  pointsCost: number;
  value: string;
  image?: string;
  minTier?: TierLevel;
  available: boolean;
  stock?: number;
  expiryDays?: number;
}

// Referral tracking
export interface Referral {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'completed' | 'rewarded';
  pointsEarned: number;
  date: string;
}

// Points earning rules
export interface EarningRule {
  id: string;
  action: string;
  points: number;
  description: string;
  multiplierApplies: boolean;
}

interface RewardsState {
  // User rewards data
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentTier: TierLevel;
  nextTierProgress: number;
  transactions: Transaction[];
  redeemedRewards: Array<{
    rewardId: string;
    rewardName: string;
    pointsSpent: number;
    redeemedAt: string;
    expiresAt?: string;
    code?: string;
  }>;
  referrals: Referral[];
  referralCode: string;

  // Tier system
  tiers: Tier[];

  // Rewards catalog
  rewards: Reward[];

  // Earning rules
  earningRules: EarningRule[];

  // Actions
  addPoints: (points: number, description: string, orderId?: string) => void;
  redeemReward: (reward: Reward) => boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTier: () => void;
  addReferral: (email: string, name: string) => void;
  updateReferralStatus: (referralId: string, status: Referral['status']) => void;
  getAvailableRewards: () => Reward[];
  getTierProgress: () => { current: Tier; next: Tier | null; progress: number };
  getPointsToNextTier: () => number;
  calculateEarningPoints: (action: string, baseAmount?: number) => number;
}

// Define tier levels
const TIERS: Tier[] = [
  {
    level: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    multiplier: 1.0,
    color: '#CD7F32',
    icon: '🥉',
    benefits: [
      'Earn 1 point per $1 spent',
      'Birthday bonus points',
      'Exclusive member promotions',
      'Early access to sales'
    ]
  },
  {
    level: 'silver',
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    multiplier: 1.25,
    color: '#C0C0C0',
    icon: '🥈',
    benefits: [
      'Earn 1.25 points per $1 spent',
      'Free standard shipping',
      'Priority customer support',
      'Extended return window (45 days)',
      'Quarterly bonus points'
    ]
  },
  {
    level: 'gold',
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 14999,
    multiplier: 1.5,
    color: '#FFD700',
    icon: '🥇',
    benefits: [
      'Earn 1.5 points per $1 spent',
      'Free express shipping',
      'Dedicated account manager',
      'Extended return window (60 days)',
      'Access to exclusive products',
      'VIP customer support'
    ]
  },
  {
    level: 'platinum',
    name: 'Platinum',
    minPoints: 15000,
    maxPoints: null,
    multiplier: 2.0,
    color: '#E5E4E2',
    icon: '💎',
    benefits: [
      'Earn 2 points per $1 spent',
      'Free overnight shipping',
      'Personal shopping assistant',
      'Extended return window (90 days)',
      'First access to new products',
      'Invitation to exclusive events',
      'Concierge customer support',
      'Custom bulk pricing'
    ]
  }
];

// Define earning rules
const EARNING_RULES: EarningRule[] = [
  {
    id: 'purchase',
    action: 'purchase',
    points: 1, // per dollar
    description: 'Earn points on every purchase',
    multiplierApplies: true
  },
  {
    id: 'signup',
    action: 'signup',
    points: 500,
    description: 'Welcome bonus for new members',
    multiplierApplies: false
  },
  {
    id: 'review',
    action: 'review',
    points: 50,
    description: 'Write a product review',
    multiplierApplies: false
  },
  {
    id: 'referral',
    action: 'referral',
    points: 1000,
    description: 'Refer a friend who makes a purchase',
    multiplierApplies: false
  },
  {
    id: 'social_share',
    action: 'social_share',
    points: 25,
    description: 'Share products on social media',
    multiplierApplies: false
  },
  {
    id: 'birthday',
    action: 'birthday',
    points: 250,
    description: 'Birthday bonus',
    multiplierApplies: false
  },
  {
    id: 'newsletter',
    action: 'newsletter',
    points: 100,
    description: 'Subscribe to newsletter',
    multiplierApplies: false
  }
];

// Define rewards catalog
const REWARDS_CATALOG: Reward[] = [
  {
    id: 'discount-5',
    name: '$5 Off Next Purchase',
    description: 'Get $5 off your next order of $50 or more',
    category: 'discount',
    pointsCost: 500,
    value: '$5',
    available: true,
    expiryDays: 30
  },
  {
    id: 'discount-10',
    name: '$10 Off Next Purchase',
    description: 'Get $10 off your next order of $100 or more',
    category: 'discount',
    pointsCost: 900,
    value: '$10',
    available: true,
    expiryDays: 30
  },
  {
    id: 'discount-25',
    name: '$25 Off Next Purchase',
    description: 'Get $25 off your next order of $250 or more',
    category: 'discount',
    pointsCost: 2000,
    value: '$25',
    minTier: 'silver',
    available: true,
    expiryDays: 60
  },
  {
    id: 'discount-50',
    name: '$50 Off Next Purchase',
    description: 'Get $50 off your next order of $500 or more',
    category: 'discount',
    pointsCost: 3500,
    value: '$50',
    minTier: 'gold',
    available: true,
    expiryDays: 60
  },
  {
    id: 'free-shipping-standard',
    name: 'Free Standard Shipping',
    description: 'Free standard shipping on your next order',
    category: 'freeShipping',
    pointsCost: 300,
    value: 'Free Shipping',
    available: true,
    expiryDays: 90
  },
  {
    id: 'free-shipping-express',
    name: 'Free Express Shipping',
    description: 'Free express shipping on your next order',
    category: 'freeShipping',
    pointsCost: 750,
    value: 'Free Express',
    minTier: 'silver',
    available: true,
    expiryDays: 90
  },
  {
    id: 'free-shipping-overnight',
    name: 'Free Overnight Shipping',
    description: 'Free overnight shipping on your next order',
    category: 'freeShipping',
    pointsCost: 1500,
    value: 'Free Overnight',
    minTier: 'gold',
    available: true,
    expiryDays: 90
  },
  {
    id: 'gift-card-25',
    name: '$25 Gift Card',
    description: 'Redeemable gift card for any purchase',
    category: 'giftCard',
    pointsCost: 2500,
    value: '$25',
    minTier: 'silver',
    available: true,
    stock: 50
  },
  {
    id: 'gift-card-50',
    name: '$50 Gift Card',
    description: 'Redeemable gift card for any purchase',
    category: 'giftCard',
    pointsCost: 4500,
    value: '$50',
    minTier: 'gold',
    available: true,
    stock: 30
  },
  {
    id: 'gift-card-100',
    name: '$100 Gift Card',
    description: 'Redeemable gift card for any purchase',
    category: 'giftCard',
    pointsCost: 8000,
    value: '$100',
    minTier: 'gold',
    available: true,
    stock: 20
  },
  {
    id: 'exclusive-preview',
    name: 'Exclusive Product Preview',
    description: 'Get early access to new product launches',
    category: 'exclusive',
    pointsCost: 1000,
    value: 'Early Access',
    minTier: 'silver',
    available: true,
    expiryDays: 30
  },
  {
    id: 'vip-support',
    name: 'VIP Support Upgrade',
    description: '30 days of priority VIP customer support',
    category: 'exclusive',
    pointsCost: 1200,
    value: '30 Days',
    minTier: 'gold',
    available: true,
    expiryDays: 30
  },
  {
    id: 'personal-shopper',
    name: 'Personal Shopping Session',
    description: '1-hour session with personal shopping assistant',
    category: 'exclusive',
    pointsCost: 2500,
    value: '1 Hour',
    minTier: 'gold',
    available: true,
    stock: 10
  },
  {
    id: 'platinum-event',
    name: 'Exclusive Event Invitation',
    description: 'Invitation to exclusive member-only event',
    category: 'exclusive',
    pointsCost: 5000,
    value: 'Event Access',
    minTier: 'platinum',
    available: true,
    stock: 5
  }
];

// Generate mock transactions for demo
const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'earn',
      points: 500,
      description: 'Welcome bonus',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'earn',
      points: 250,
      description: 'Purchase - Order #1001',
      date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
      orderId: '1001'
    },
    {
      id: '3',
      type: 'earn',
      points: 50,
      description: 'Product review',
      date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'earn',
      points: 500,
      description: 'Purchase - Order #1005',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      orderId: '1005'
    },
    {
      id: '5',
      type: 'redeem',
      points: -500,
      description: 'Redeemed: $5 Off Next Purchase',
      date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '6',
      type: 'earn',
      points: 1000,
      description: 'Referral bonus - John Doe',
      date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '7',
      type: 'earn',
      points: 750,
      description: 'Purchase - Order #1012',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      orderId: '1012'
    },
    {
      id: '8',
      type: 'bonus',
      points: 250,
      description: 'Birthday bonus',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '9',
      type: 'earn',
      points: 1250,
      description: 'Purchase - Order #1018',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      orderId: '1018'
    },
    {
      id: '10',
      type: 'earn',
      points: 50,
      description: 'Product review',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  return transactions;
};

// Generate referral code
const generateReferralCode = (): string => {
  return 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      // Initial state
      totalPoints: 4100,
      availablePoints: 4100,
      lifetimePoints: 4600,
      currentTier: 'silver',
      nextTierProgress: 62,
      transactions: generateMockTransactions(),
      redeemedRewards: [],
      referrals: [
        {
          id: '1',
          email: 'john.doe@example.com',
          name: 'John Doe',
          status: 'rewarded',
          pointsEarned: 1000,
          date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          status: 'completed',
          pointsEarned: 0,
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          email: 'bob.johnson@example.com',
          name: 'Bob Johnson',
          status: 'pending',
          pointsEarned: 0,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      referralCode: generateReferralCode(),
      tiers: TIERS,
      rewards: REWARDS_CATALOG,
      earningRules: EARNING_RULES,

      // Add points
      addPoints: (points, description, orderId) => {
        const state = get();
        const transaction: Transaction = {
          id: Date.now().toString(),
          type: 'earn',
          points,
          description,
          date: new Date().toISOString(),
          orderId
        };

        set({
          totalPoints: state.totalPoints + points,
          availablePoints: state.availablePoints + points,
          lifetimePoints: state.lifetimePoints + points,
          transactions: [transaction, ...state.transactions]
        });

        // Update tier after adding points
        get().updateTier();
      },

      // Redeem reward
      redeemReward: (reward) => {
        const state = get();

        // Check if user has enough points
        if (state.availablePoints < reward.pointsCost) {
          return false;
        }

        // Check tier requirement
        if (reward.minTier) {
          const currentTierIndex = TIERS.findIndex(t => t.level === state.currentTier);
          const requiredTierIndex = TIERS.findIndex(t => t.level === reward.minTier);
          if (currentTierIndex < requiredTierIndex) {
            return false;
          }
        }

        // Check stock
        if (reward.stock !== undefined && reward.stock <= 0) {
          return false;
        }

        // Create transaction
        const transaction: Transaction = {
          id: Date.now().toString(),
          type: 'redeem',
          points: -reward.pointsCost,
          description: `Redeemed: ${reward.name}`,
          date: new Date().toISOString()
        };

        // Calculate expiry date if applicable
        const expiresAt = reward.expiryDays
          ? new Date(Date.now() + reward.expiryDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        // Generate reward code
        const code = 'RWD' + Math.random().toString(36).substring(2, 10).toUpperCase();

        // Update state
        set({
          availablePoints: state.availablePoints - reward.pointsCost,
          transactions: [transaction, ...state.transactions],
          redeemedRewards: [
            {
              rewardId: reward.id,
              rewardName: reward.name,
              pointsSpent: reward.pointsCost,
              redeemedAt: new Date().toISOString(),
              expiresAt,
              code
            },
            ...state.redeemedRewards
          ],
          rewards: state.rewards.map(r =>
            r.id === reward.id && r.stock !== undefined
              ? { ...r, stock: r.stock - 1, available: r.stock - 1 > 0 }
              : r
          )
        });

        return true;
      },

      // Add transaction
      addTransaction: (transaction) => {
        const state = get();
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString()
        };

        const pointsChange = transaction.points;
        set({
          transactions: [newTransaction, ...state.transactions],
          totalPoints: state.totalPoints + pointsChange,
          availablePoints: state.availablePoints + pointsChange,
          lifetimePoints: transaction.type === 'earn' || transaction.type === 'bonus'
            ? state.lifetimePoints + pointsChange
            : state.lifetimePoints
        });

        get().updateTier();
      },

      // Update tier based on lifetime points
      updateTier: () => {
        const state = get();
        const lifetimePoints = state.lifetimePoints;

        // Find current tier
        let newTier: TierLevel = 'bronze';
        for (const tier of TIERS) {
          if (lifetimePoints >= tier.minPoints) {
            if (tier.maxPoints === null || lifetimePoints <= tier.maxPoints) {
              newTier = tier.level;
              break;
            }
            newTier = tier.level;
          }
        }

        // Calculate progress to next tier
        const currentTierData = TIERS.find(t => t.level === newTier)!;
        const currentTierIndex = TIERS.findIndex(t => t.level === newTier);
        const nextTierData = currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;

        let progress = 0;
        if (nextTierData) {
          const pointsInCurrentTier = lifetimePoints - currentTierData.minPoints;
          const pointsNeededForNextTier = nextTierData.minPoints - currentTierData.minPoints;
          progress = Math.round((pointsInCurrentTier / pointsNeededForNextTier) * 100);
        } else {
          progress = 100; // Max tier reached
        }

        set({
          currentTier: newTier,
          nextTierProgress: progress
        });
      },

      // Add referral
      addReferral: (email, name) => {
        const state = get();
        const referral: Referral = {
          id: Date.now().toString(),
          email,
          name,
          status: 'pending',
          pointsEarned: 0,
          date: new Date().toISOString()
        };

        set({
          referrals: [referral, ...state.referrals]
        });
      },

      // Update referral status
      updateReferralStatus: (referralId, status) => {
        const state = get();
        const referral = state.referrals.find(r => r.id === referralId);

        if (!referral) return;

        // Award points when referral is completed
        if (status === 'rewarded' && referral.status === 'completed') {
          const referralRule = EARNING_RULES.find(r => r.action === 'referral');
          const points = referralRule?.points || 1000;

          get().addPoints(points, `Referral bonus - ${referral.name}`);

          set({
            referrals: state.referrals.map(r =>
              r.id === referralId
                ? { ...r, status, pointsEarned: points }
                : r
            )
          });
        } else {
          set({
            referrals: state.referrals.map(r =>
              r.id === referralId ? { ...r, status } : r
            )
          });
        }
      },

      // Get available rewards based on tier
      getAvailableRewards: () => {
        const state = get();
        const currentTierIndex = TIERS.findIndex(t => t.level === state.currentTier);

        return state.rewards.filter(reward => {
          if (!reward.available) return false;
          if (reward.stock !== undefined && reward.stock <= 0) return false;

          if (reward.minTier) {
            const requiredTierIndex = TIERS.findIndex(t => t.level === reward.minTier);
            return currentTierIndex >= requiredTierIndex;
          }

          return true;
        });
      },

      // Get tier progress
      getTierProgress: () => {
        const state = get();
        const currentTierIndex = TIERS.findIndex(t => t.level === state.currentTier);
        const current = TIERS[currentTierIndex];
        const next = currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;

        let progress = 0;
        if (next) {
          const pointsInCurrentTier = state.lifetimePoints - current.minPoints;
          const pointsNeededForNextTier = next.minPoints - current.minPoints;
          progress = Math.round((pointsInCurrentTier / pointsNeededForNextTier) * 100);
        } else {
          progress = 100;
        }

        return { current, next, progress };
      },

      // Get points to next tier
      getPointsToNextTier: () => {
        const state = get();
        const currentTierIndex = TIERS.findIndex(t => t.level === state.currentTier);
        const nextTier = currentTierIndex < TIERS.length - 1 ? TIERS[currentTierIndex + 1] : null;

        if (!nextTier) return 0;

        return nextTier.minPoints - state.lifetimePoints;
      },

      // Calculate earning points with multiplier
      calculateEarningPoints: (action, baseAmount = 0) => {
        const state = get();
        const rule = EARNING_RULES.find(r => r.action === action);

        if (!rule) return 0;

        const currentTier = TIERS.find(t => t.level === state.currentTier)!;
        const multiplier = rule.multiplierApplies ? currentTier.multiplier : 1;

        if (action === 'purchase' && baseAmount > 0) {
          return Math.round(baseAmount * rule.points * multiplier);
        }

        return Math.round(rule.points * multiplier);
      }
    }),
    {
      name: 'rewards-storage'
    }
  )
);
