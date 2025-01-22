import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Background Elements */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="majestic-blur" />
        
        {/* Animated Orbs */}
        <div 
          className="floating-orb w-96 h-96"
          style={{ 
            '--orb-color': '#FF4D4D',
            top: '20%',
            left: '15%',
            animationDelay: '0s'
          } as any}
        />
        <div 
          className="floating-orb w-80 h-80"
          style={{ 
            '--orb-color': '#FFD700',
            top: '60%',
            right: '10%',
            animationDelay: '-5s'
          } as any}
        />
        <div 
          className="floating-orb w-64 h-64"
          style={{ 
            '--orb-color': '#FF8C00',
            top: '40%',
            left: '60%',
            animationDelay: '-10s'
          } as any}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Floating Creator Stats */}
            <div className="absolute top-20 right-10 glass-card p-4 rounded-xl animate-float" style={{ animationDelay: '-2s' }}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="text-sm text-gray-300">Active Creators</p>
                  <p className="text-xl font-bold text-gradient">10K+</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-32 left-10 glass-card p-4 rounded-xl animate-float" style={{ animationDelay: '-4s' }}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">💫</span>
                <div>
                  <p className="text-sm text-gray-300">Success Rate</p>
                  <p className="text-xl font-bold text-gradient-purple">98%</p>
                </div>
              </div>
            </div>

            {/* Floating Achievements */}
            <div className="absolute top-40 left-20 glass-card p-3 rounded-full animate-float" style={{ animationDelay: '-1s' }}>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="absolute bottom-40 right-20 glass-card p-3 rounded-full animate-float" style={{ animationDelay: '-3s' }}>
              <span className="text-2xl">⭐</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="text-center lg:text-left space-y-8">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                  <span className="text-gradient animate-glow inline-block">
                    Amplify Your
                  </span>
                  <br />
                  <span className="text-gradient-purple animate-pulse-slow inline-block">
                    Creative Journey
                  </span>
                </h1>
                
                <p className="max-w-2xl mx-auto lg:mx-0 text-lg sm:text-xl text-gray-300">
                  Connect with top brands and create impactful content that resonates with your audience. 
                  Transform your passion into a thriving creative business.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/signup"
                    className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-accent-red via-accent-orange to-accent text-white font-medium hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 hover-lift"
                  >
                    Start Creating
                    <svg className="ml-2 w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  
                  <Link
                    href="/projects"
                    className="inline-flex items-center px-8 py-4 rounded-full glass-effect text-white font-medium hover-glow"
                  >
                    Explore Opportunities
                  </Link>
                </div>
              </div>

              {/* Feature Image */}
              <div className="hidden lg:block relative">
                <div className="relative w-full h-[600px]">
                  {/* Creator Highlights */}
                  <div className="absolute -top-10 -right-10 glass-card p-4 rounded-xl animate-float z-20" style={{ animationDelay: '-2s' }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-red to-accent flex items-center justify-center text-xl">
                        🎨
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">Top Creator</p>
                        <p className="text-md font-bold text-white">Digital Artist</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-10 -left-10 glass-card p-4 rounded-xl animate-float z-20" style={{ animationDelay: '-3s' }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-orange to-accent flex items-center justify-center text-xl">
                        📸
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">Featured</p>
                        <p className="text-md font-bold text-white">Photographer</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-accent-red to-accent rounded-full blur-2xl opacity-20 animate-float" style={{ animationDelay: '-2s' }} />
                  <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-gradient-to-r from-accent-orange to-accent rounded-full blur-2xl opacity-20 animate-float" style={{ animationDelay: '-4s' }} />
                  
                  {/* Floating Icons */}
                  <div className="absolute top-10 right-10 text-4xl animate-float" style={{ animationDelay: '-1s' }}>✨</div>
                  <div className="absolute bottom-20 left-10 text-4xl animate-float" style={{ animationDelay: '-3s' }}>🎯</div>
                  <div className="absolute top-1/2 right-0 text-4xl animate-float" style={{ animationDelay: '-5s' }}>⚡</div>

                  {/* Creator Image */}
                  <div className="relative z-10 glass-card rounded-2xl p-4 transform hover:scale-105 transition-transform duration-500">
                    <Image
                      src="/creator-setup.png"
                      alt="Creator Setup"
                      fill
                      className="object-contain animate-float"
                      priority
                    />
                    
                    {/* Decorative Elements */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-accent rounded-full animate-pulse" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent-orange rounded-full animate-pulse" style={{ animationDelay: '-1s' }} />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-accent-red rounded-full animate-pulse" style={{ animationDelay: '-2s' }} />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: '-3s' }} />
                  </div>

                  {/* Animated Lines */}
                  <div className="absolute inset-0 z-20">
                    <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent-orange/20 to-transparent animate-pulse-slow" />
                    <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent-red/20 to-transparent animate-pulse-slow" style={{ animationDelay: '-2s' }} />
                  </div>

                  {/* Radial Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-radial from-transparent to-black z-30 opacity-60" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Grow Your Audience",
                  description: "Connect with brands that align with your values and expand your reach.",
                  icon: "🚀",
                  gradient: "from-accent-red to-accent-orange"
                },
                {
                  title: "Secure Partnerships",
                  description: "Build lasting relationships with verified brands and creators.",
                  icon: "🤝",
                  gradient: "from-accent to-accent-red"
                },
                {
                  title: "Create Impact",
                  description: "Make a difference with meaningful content partnerships.",
                  icon: "✨",
                  gradient: "from-accent-orange to-accent"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="glass-card rounded-2xl p-8 hover:bg-gradient-to-br hover:from-black/60 hover:to-black/40 hover-lift"
                >
                  <div className="text-5xl mb-6 animate-bounce-slow">
                    {feature.icon}
                  </div>
                  <h3 className={`text-xl font-semibold mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}