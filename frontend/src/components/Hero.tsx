import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative h-[600px] flex items-center justify-center">
      {/* Image de fond avec plats africains */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-sm"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Contenu overlay */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
          Savourez l&apos;Afrique, Livré chez vous
        </h1>
        <p className="text-xl md:text-2xl text-white mb-8 drop-shadow-md">
          Découvrez une explosion de saveurs authentiques directement à votre porte.
        </p>
        <Link
          href="/menu"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
        >
          Voir le menu
        </Link>
      </div>
    </section>
  );
}

