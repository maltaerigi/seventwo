const existingFeatures = [
  {
    title: 'Instant Settlement',
    description: 'Our algorithm calculates who owes whom with minimum transactions. No more confusion.',
    icon: '⚡',
  },
  {
    title: 'Organize Games Easily',
    description: 'Create events in seconds. Set blinds, player limits, and share a link.',
    icon: '🎯',
  },
  {
    title: 'Track Performance',
    description: 'See your win/loss history and track your poker journey over time.',
    icon: '📊',
  },
];

const upcomingFeatures = [
  {
    title: 'Payment Integration',
    description: 'Send payments directly through Venmo, Cash App, or PayPal.',
    icon: '💳',
    badge: 'Coming Soon',
  },
  {
    title: 'Poker Trainer',
    description: 'Practice your game with range trainers and equity calculators.',
    icon: '🎓',
    badge: 'Coming Soon',
  },
  {
    title: 'Friends & Badges',
    description: 'Add friends, earn badges, and see who your poker nemesis is.',
    icon: '🏆',
    badge: 'Coming Soon',
  },
];

export function Features() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Features
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Built by poker players, for poker players
          </p>
        </div>

        {/* Existing Features */}
        <div className="mt-12">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Available Now
          </h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {existingFeatures.map((feature) => (
              <div 
                key={feature.title}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h4 className="mt-4 font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Features */}
        <div className="mt-16">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Coming Soon
          </h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {upcomingFeatures.map((feature) => (
              <div 
                key={feature.title}
                className="relative rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
              >
                {feature.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {feature.badge}
                  </span>
                )}
                <div className="text-3xl opacity-60">{feature.icon}</div>
                <h4 className="mt-4 font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Many More */}
        <div className="mt-12 text-center">
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Many more features coming...
          </p>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
            We're constantly building new features. Stay tuned!
          </p>
        </div>
      </div>
    </section>
  );
}
