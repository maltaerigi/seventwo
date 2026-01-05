import { Hero, HowItWorks, Features, Newsletter, Footer } from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <Newsletter variant="light" />
      <Features />
      <Newsletter variant="dark" />
      <Footer />
    </main>
  );
}
