'use client';

import { useState, useMemo } from 'react';
import { useRewardsStore, type Reward, type TierLevel, type RewardCategory } from '@/store/rewards-store';
import {
  Gift,
  TrendingUp,
  Award,
  History,
  Users,
  Share2,
  Check,
  Lock,
  Calendar,
  ArrowRight,
  Copy,
  Package,
  Truck,
  CreditCard,
  Star,
  Sparkles,
  Filter,
  Search,
  X,
  Info,
  ChevronRight,
  Trophy,
  Target,
  Zap
} from 'lucide-react';

type TabType = 'overview' | 'rewards' | 'history' | 'referrals';

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCategory, setSelectedCategory] = useState<RewardCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralEmail, setReferralEmail] = useState('');
  const [referralName, setReferralName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    totalPoints,
    availablePoints,
    lifetimePoints,
    currentTier,
    transactions,
    redeemedRewards,
    referrals,
    referralCode,
    tiers,
    earningRules,
    redeemReward,
    getAvailableRewards,
    getTierProgress,
    getPointsToNextTier,
    addReferral
  } = useRewardsStore();

  const availableRewards = getAvailableRewards();
  const tierProgress = getTierProgress();
  const pointsToNextTier = getPointsToNextTier();

  // Filter rewards
  const filteredRewards = useMemo(() => {
    return availableRewards.filter(reward => {
      const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
      const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [availableRewards, selectedCategory, searchQuery]);

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const handleConfirmRedeem = () => {
    if (selectedReward) {
      const success = redeemReward(selectedReward);
      if (success) {
        setShowRedeemModal(false);
        setSelectedReward(null);
      }
    }
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendReferral = () => {
    if (referralEmail && referralName) {
      addReferral(referralEmail, referralName);
      setReferralEmail('');
      setReferralName('');
      setShowReferralModal(false);
    }
  };

  const getCategoryIcon = (category: RewardCategory) => {
    switch (category) {
      case 'discount':
        return <CreditCard className="w-4 h-4" />;
      case 'freeShipping':
        return <Truck className="w-4 h-4" />;
      case 'giftCard':
        return <Gift className="w-4 h-4" />;
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'exclusive':
        return <Star className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: TierLevel) => {
    const tierData = tiers.find(t => t.level === tier);
    return tierData?.color || '#CD7F32';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Rewards Program</h1>
              <p className="text-blue-100 mt-1">Earn points, unlock benefits, and save more</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Available Points</span>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="text-3xl font-bold">{availablePoints.toLocaleString()}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Current Tier</span>
                <Award className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{tierProgress.current.name}</span>
                <span className="text-2xl">{tierProgress.current.icon}</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Lifetime Points</span>
                <TrendingUp className="w-5 h-5 text-green-300" />
              </div>
              <div className="text-3xl font-bold">{lifetimePoints.toLocaleString()}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100">Referrals</span>
                <Users className="w-5 h-5 text-purple-300" />
              </div>
              <div className="text-3xl font-bold">{referrals.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: Target },
              { id: 'rewards', label: 'Rewards Catalog', icon: Gift },
              { id: 'history', label: 'History', icon: History },
              { id: 'referrals', label: 'Referrals', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Tier Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  Your Tier Progress
                </h2>
              </div>
              <div className="p-6">
                {/* Current and Next Tier */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                      style={{ backgroundColor: tierProgress.current.color + '20' }}
                    >
                      {tierProgress.current.icon}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Current Tier</div>
                      <div className="text-2xl font-bold text-gray-900">{tierProgress.current.name}</div>
                      <div className="text-sm text-gray-600">{tierProgress.current.multiplier}x points multiplier</div>
                    </div>
                  </div>

                  {tierProgress.next && (
                    <>
                      <div className="flex-1 mx-8">
                        <div className="relative">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${tierProgress.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <span className="text-gray-600">{tierProgress.progress}% Complete</span>
                            <span className="text-gray-600">{pointsToNextTier.toLocaleString()} points to go</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Next Tier</div>
                          <div className="text-2xl font-bold text-gray-900">{tierProgress.next.name}</div>
                          <div className="text-sm text-gray-600">{tierProgress.next.multiplier}x points multiplier</div>
                        </div>
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg opacity-50"
                          style={{ backgroundColor: tierProgress.next.color + '20' }}
                        >
                          {tierProgress.next.icon}
                        </div>
                      </div>
                    </>
                  )}

                  {!tierProgress.next && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-6 h-6" />
                      <span className="text-lg font-semibold">Maximum Tier Achieved!</span>
                    </div>
                  )}
                </div>

                {/* Tier Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Current Benefits
                    </h3>
                    <ul className="space-y-2">
                      {tierProgress.current.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {tierProgress.next && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-300">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-600" />
                        Unlock at {tierProgress.next.name}
                      </h3>
                      <ul className="space-y-2">
                        {tierProgress.next.benefits.slice(tierProgress.current.benefits.length).map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* All Tier Levels */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-blue-600" />
                  Membership Tiers
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tiers.map((tier) => (
                    <div
                      key={tier.level}
                      className={`
                        rounded-xl p-6 border-2 transition-all
                        ${tier.level === currentTier
                          ? 'border-blue-600 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      style={{
                        backgroundColor: tier.level === currentTier ? tier.color + '10' : 'white'
                      }}
                    >
                      <div className="text-center mb-4">
                        <div className="text-4xl mb-2">{tier.icon}</div>
                        <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          {tier.minPoints.toLocaleString()}
                          {tier.maxPoints ? ` - ${tier.maxPoints.toLocaleString()}` : '+'} pts
                        </div>
                      </div>
                      <div className="text-center py-2 px-3 bg-white rounded-lg border border-gray-200 mb-4">
                        <div className="text-2xl font-bold text-gray-900">{tier.multiplier}x</div>
                        <div className="text-xs text-gray-600">Points Multiplier</div>
                      </div>
                      {tier.level === currentTier && (
                        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 mb-2">
                          <Check className="w-4 h-4" />
                          <span>Your Tier</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* How to Earn Points */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  Ways to Earn Points
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earningRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
                    >
                      <div className="p-3 bg-blue-600 rounded-xl text-white">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{rule.action.charAt(0).toUpperCase() + rule.action.slice(1).replace('_', ' ')}</div>
                        <div className="text-sm text-gray-600 mt-1">{rule.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg font-bold text-blue-600">
                            {rule.action === 'purchase' ? `${rule.points} pt/$` : `${rule.points} pts`}
                          </span>
                          {rule.multiplierApplies && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                              Tier bonus applies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Rewards */}
            {redeemedRewards.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Gift className="w-6 h-6 text-blue-600" />
                    Recently Redeemed
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {redeemedRewards.slice(0, 5).map((reward, index) => (
                    <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl text-green-600">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{reward.rewardName}</div>
                          <div className="text-sm text-gray-600">
                            Redeemed on {formatDate(reward.redeemedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {reward.code && (
                          <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded-lg mb-1">
                            {reward.code}
                          </div>
                        )}
                        {reward.expiresAt && (
                          <div className="text-xs text-gray-500">
                            Expires {formatDate(reward.expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rewards Catalog Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search rewards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'All', icon: Filter },
                    { value: 'discount', label: 'Discounts', icon: CreditCard },
                    { value: 'freeShipping', label: 'Shipping', icon: Truck },
                    { value: 'giftCard', label: 'Gift Cards', icon: Gift },
                    { value: 'exclusive', label: 'Exclusive', icon: Star }
                  ].map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value as RewardCategory | 'all')}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                          ${selectedCategory === category.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredRewards.length} of {availableRewards.length} rewards
              </div>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => {
                const canAfford = availablePoints >= reward.pointsCost;
                const meetsMinTier = !reward.minTier || tiers.findIndex(t => t.level === currentTier) >= tiers.findIndex(t => t.level === reward.minTier);

                return (
                  <div
                    key={reward.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    {/* Reward Header */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          {getCategoryIcon(reward.category)}
                        </div>
                        {reward.minTier && (
                          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                            <Award className="w-3 h-3" />
                            {tiers.find(t => t.level === reward.minTier)?.name}+
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{reward.name}</h3>
                      <div className="text-3xl font-bold">{reward.value}</div>
                    </div>

                    {/* Reward Body */}
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-4">{reward.description}</p>

                      {/* Stock indicator */}
                      {reward.stock !== undefined && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Package className="w-4 h-4" />
                          <span>{reward.stock} remaining</span>
                        </div>
                      )}

                      {/* Expiry info */}
                      {reward.expiryDays && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Calendar className="w-4 h-4" />
                          <span>Expires in {reward.expiryDays} days after redemption</span>
                        </div>
                      )}

                      {/* Points cost */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-gray-900">
                          {reward.pointsCost.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600">points</span>
                      </div>

                      {/* Redeem button */}
                      <button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!canAfford || !meetsMinTier || !reward.available}
                        className={`
                          w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
                          ${canAfford && meetsMinTier && reward.available
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        {!meetsMinTier ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Tier Locked
                          </>
                        ) : !canAfford ? (
                          <>
                            <Info className="w-4 h-4" />
                            Need {(reward.pointsCost - availablePoints).toLocaleString()} more points
                          </>
                        ) : !reward.available ? (
                          <>
                            <X className="w-4 h-4" />
                            Out of Stock
                          </>
                        ) : (
                          <>
                            Redeem Now
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredRewards.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No rewards found</h3>
                <p className="text-gray-600">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-600" />
                  Transaction History
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          p-3 rounded-xl
                          ${transaction.type === 'earn' ? 'bg-green-100 text-green-600' :
                            transaction.type === 'bonus' ? 'bg-blue-100 text-blue-600' :
                            transaction.type === 'redeem' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }
                        `}
                      >
                        {transaction.type === 'earn' && <TrendingUp className="w-5 h-5" />}
                        {transaction.type === 'bonus' && <Sparkles className="w-5 h-5" />}
                        {transaction.type === 'redeem' && <Gift className="w-5 h-5" />}
                        {transaction.type === 'expire' && <Calendar className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-600">{formatDate(transaction.date)}</div>
                        {transaction.orderId && (
                          <div className="text-xs text-gray-500 mt-1">Order #{transaction.orderId}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`
                          text-2xl font-bold
                          ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}
                        `}
                      >
                        {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">points</div>
                    </div>
                  </div>
                ))}

                {transactions.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                    <p className="text-gray-600">Start earning points by making purchases</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            {/* Referral Program Info */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg text-white p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Refer & Earn</h2>
                  <p className="text-purple-100">Earn 1,000 points for each friend who makes a purchase</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-8 h-8" />
                </div>
              </div>

              {/* Referral Code */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-sm text-purple-100 mb-2">Your Referral Code</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white rounded-lg px-4 py-3 text-2xl font-bold text-gray-900 tracking-wider">
                    {referralCode}
                  </div>
                  <button
                    onClick={handleCopyReferralCode}
                    className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={() => setShowReferralModal(true)}
                className="mt-4 w-full bg-white text-purple-600 py-3 px-6 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Invite Friends
              </button>
            </div>

            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {referrals.filter(r => r.status === 'pending').length}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-sm text-gray-600">Points Earned</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {referrals.reduce((sum, r) => sum + r.pointsEarned, 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Referrals List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Your Referrals</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          p-3 rounded-xl
                          ${referral.status === 'rewarded' ? 'bg-green-100 text-green-600' :
                            referral.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                            'bg-yellow-100 text-yellow-600'
                          }
                        `}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{referral.name}</div>
                        <div className="text-sm text-gray-600">{referral.email}</div>
                        <div className="text-xs text-gray-500 mt-1">Referred on {formatDate(referral.date)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`
                          inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                          ${referral.status === 'rewarded' ? 'bg-green-100 text-green-700' :
                            referral.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }
                        `}
                      >
                        {referral.status === 'rewarded' && <Check className="w-4 h-4" />}
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </div>
                      {referral.pointsEarned > 0 && (
                        <div className="text-sm text-green-600 font-semibold mt-2">
                          +{referral.pointsEarned.toLocaleString()} points
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {referrals.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No referrals yet</h3>
                    <p className="text-gray-600 mb-4">Start referring friends to earn bonus points</p>
                    <button
                      onClick={() => setShowReferralModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      Invite Your First Friend
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Redeem Reward Modal */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Confirm Redemption</h3>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-600 rounded-xl text-white">
                    {getCategoryIcon(selectedReward.category)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedReward.name}</h4>
                    <p className="text-sm text-gray-600">{selectedReward.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                  <span className="text-gray-700">Points Required</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {selectedReward.pointsCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Current Balance</span>
                  <span className="font-semibold text-gray-900">{availablePoints.toLocaleString()} pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Balance After</span>
                  <span className="font-semibold text-gray-900">
                    {(availablePoints - selectedReward.pointsCost).toLocaleString()} pts
                  </span>
                </div>
              </div>

              {selectedReward.expiryDays && (
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    This reward will expire {selectedReward.expiryDays} days after redemption
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedReward(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Invite a Friend</h3>
              <p className="text-gray-600 mt-1">Share your referral code and earn 1,000 points</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Friend's Name
                  </label>
                  <input
                    type="text"
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Friend's Email
                  </label>
                  <input
                    type="email"
                    value={referralEmail}
                    onChange={(e) => setReferralEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your friend signs up using your code</li>
                      <li>They make their first purchase</li>
                      <li>You both earn bonus points!</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReferralModal(false);
                    setReferralEmail('');
                    setReferralName('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReferral}
                  disabled={!referralEmail || !referralName}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
