import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants';
import {
  ProfileHeader,
  StatsCards,
  PerformanceChart,
  GameHistoryList,
  RecentActivity,
} from '@/components/profile';
import type { Profile, UserGameResult } from '@/types';

export const metadata = {
  title: 'My Profile',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch game history (events the user participated in with their results)
  const { data: participantData } = await supabase
    .from('event_participants')
    .select(`
      id,
      event_id,
      buy_in_amount,
      cash_out_amount,
      net_profit_loss,
      status,
      events (
        id,
        title,
        event_date,
        event_time
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Transform to UserGameResult format
  // Type the events relation properly
  type EventData = { id: string; title: string; event_date: string; event_time: string };
  
  const gameResults: UserGameResult[] = (participantData || [])
    .filter((p) => p.events)
    .map((p) => {
      const event = p.events as unknown as EventData;
      return {
        event_id: p.event_id,
        event_title: event.title,
        event_date: event.event_date,
        event_time: event.event_time,
        buy_in_amount: p.buy_in_amount,
        cash_out_amount: p.cash_out_amount,
        net_profit_loss: p.net_profit_loss,
        status: p.status,
      };
    });

  // Calculate stats
  const completedGames = gameResults.filter((g) => g.cash_out_amount !== null);
  const winningGames = completedGames.filter((g) => g.net_profit_loss > 0).length;
  const totalBuyIns = completedGames.reduce((sum, g) => sum + g.buy_in_amount, 0);

  // Build profile with defaults
  const profile: Profile = {
    id: user.id,
    display_name: profileData?.display_name || user.email?.split('@')[0] || 'Player',
    avatar_url: profileData?.avatar_url || null,
    phone: profileData?.phone || user.phone || null,
    email: profileData?.email || user.email || null,
    total_games_played: profileData?.total_games_played || completedGames.length,
    total_profit_loss: profileData?.total_profit_loss || completedGames.reduce((sum, g) => sum + g.net_profit_loss, 0),
    created_at: profileData?.created_at || user.created_at || new Date().toISOString(),
    updated_at: profileData?.updated_at || new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🃏</span>
            <span className="font-semibold text-slate-900 dark:text-white">Seventwo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href={ROUTES.EVENTS}
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              My Events
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeader profile={profile} />

          {/* Stats Cards */}
          <StatsCards
            totalProfitLoss={profile.total_profit_loss}
            totalGamesPlayed={completedGames.length}
            winningGames={winningGames}
            totalBuyIns={totalBuyIns}
          />

          {/* Charts and Recent Activity - Side by Side on Desktop */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Performance Chart - Takes more space */}
            <div className="lg:col-span-3">
              <PerformanceChart gameResults={gameResults} />
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <RecentActivity gameResults={gameResults} limit={5} />
            </div>
          </div>

          {/* Game History - Full Width */}
          <div id="game-history">
            <GameHistoryList gameResults={gameResults} />
          </div>
        </div>
      </main>
    </div>
  );
}

