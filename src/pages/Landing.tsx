import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, MessageSquare, Brain, Zap, Lock, BarChart3 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black" />
              <span className="text-xl font-semibold text-black tracking-tight">SentimentDB</span>
            </div>
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-sm text-slate-600 hover:text-black transition-colors">Features</a>
              <a href="#platform" className="text-sm text-slate-600 hover:text-black transition-colors">Platform</a>
              <a href="#security" className="text-sm text-slate-600 hover:text-black transition-colors">Security</a>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-black text-white text-xs font-medium uppercase tracking-wider">
                AI-Powered Sentiment Analysis Platform
              </div>
              
              <h1 className="text-7xl font-bold text-black leading-[1.1] tracking-tighter">
                Smarter Sentiment
                <br />
                Analysis
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed max-w-lg font-light">
                Enterprise-grade sentiment analysis platform for social media intelligence. Fast, precise, and built for scale.
              </p>
              
              <div className="flex items-center gap-4 pt-4">
                <Link to="/login">
                  <Button 
                    size="lg" 
                    className="bg-black hover:bg-slate-800 text-white px-8 py-6 text-base shadow-sm"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-6 text-base border-2 border-slate-900 hover:bg-slate-50"
                >
                  Documentation
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-12 pt-8 border-t border-slate-200">
                <div>
                  <div className="text-4xl font-bold text-black tracking-tight">99.2%</div>
                  <div className="text-sm text-slate-600 uppercase tracking-wide mt-1">Accuracy</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-black tracking-tight">&lt;50ms</div>
                  <div className="text-sm text-slate-600 uppercase tracking-wide mt-1">Latency</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-black tracking-tight">24/7</div>
                  <div className="text-sm text-slate-600 uppercase tracking-wide mt-1">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Content - Static Grid Visualization */}
            <div className="relative h-[600px] hidden lg:block">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Data Cards */}
              <div className="absolute top-20 right-20 z-20">
                <div className="bg-white border-2 border-black p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black" />
                    <div>
                      <div className="text-sm font-semibold text-black uppercase tracking-wide">Positive Trend</div>
                      <div className="text-xs text-slate-600 mt-1">+15.2% increase</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-32 left-10 z-20">
                <div className="bg-black text-white p-6 shadow-lg">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2">Analysis Complete</div>
                  <div className="text-4xl font-bold tracking-tight">89%</div>
                  <div className="text-xs uppercase tracking-wide mt-2 opacity-70">Confidence Score</div>
                </div>
              </div>

              {/* Center Accent */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-64 h-64 border border-slate-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border border-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-8 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16">
            <h2 className="text-5xl font-bold text-black mb-4 tracking-tight">
              Platform Features
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl font-light">
              Enterprise-grade tools for comprehensive sentiment analysis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-slate-200">
            {[
              {
                icon: TrendingUp,
                title: 'Real-Time Sentiment Analysis',
                description: 'Live sentiment tracking with instant insights and comprehensive dashboards for data-driven decisions.'
              },
              {
                icon: MessageSquare,
                title: 'Multi-Platform',
                description: 'Unified analysis across Facebook, Twitter, Instagram, and LinkedIn from a single interface.'
              },
              {
                icon: Brain,
                title: 'AI Processing',
                description: 'Advanced machine learning models deliver 99.2% accuracy with context-aware sentiment detection.'
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                description: 'Bank-grade encryption, SOC 2 compliance, and granular access controls for your data.'
              },
              {
                icon: BarChart3,
                title: 'Custom Reports',
                description: 'Automated reporting with customizable metrics, export options, and scheduled deliveries.'
              },
              {
                icon: Zap,
                title: 'API Integration',
                description: 'RESTful API with comprehensive documentation and SDKs for seamless integration.'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-10 bg-white hover:bg-slate-50 transition-colors border-l-4 border-transparent hover:border-black"
              >
                <feature.icon className="w-10 h-10 text-black mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold text-black mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-light text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 bg-black text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-bold mb-6 tracking-tight">
            Ready to Start?
          </h2>
          <p className="text-xl text-slate-300 mb-10 font-light">
            Join leading enterprises using SentimentDB for social intelligence
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login">
              <Button 
                size="lg" 
                className="bg-white hover:bg-slate-100 text-black px-10 py-6 text-base font-semibold"
              >
                Start Free Trial
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              className="px-10 py-6 text-base border-2 border-white text-white hover:bg-white hover:text-black"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black" />
              <span className="text-xl font-semibold text-black tracking-tight">SentimentDB</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-600">
              <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-black transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            © 2025 SentimentDB. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
