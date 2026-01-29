import Header from '@/components/Header';
import Hero from '@/components/Hero';
import PopularDishes from '@/components/PopularDishes';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <PopularDishes />
      </main>
      <Footer />
    </div>
  );
}
