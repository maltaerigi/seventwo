const steps = [
  {
    number: '01',
    title: 'Create an Event',
    description: 'Set up your poker night in seconds. Add the date, location, and game rules.',
    icon: '📅',
  },
  {
    number: '02',
    title: 'Invite Friends',
    description: 'Share your unique event link. Friends join with one click.',
    icon: '🔗',
  },
  {
    number: '03',
    title: 'Track the Game',
    description: 'Record buy-ins and cash-outs as the night goes on.',
    icon: '💰',
  },
  {
    number: '04',
    title: 'Settle Up',
    description: 'We calculate who owes whom. Send payments with one tap.',
    icon: '✅',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 px-4 py-24 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            From setup to settlement in four simple steps
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div 
              key={step.number}
              className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-amber-500/50 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              {/* Step number */}
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {step.number}
              </span>
              
              {/* Icon */}
              <div className="mt-4 text-4xl">
                {step.icon}
              </div>
              
              {/* Content */}
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

