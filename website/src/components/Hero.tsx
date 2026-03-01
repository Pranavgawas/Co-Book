
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6 sm:p-12 font-sans overflow-hidden relative">
      
      {/* Background Glow Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
        
        {/* Left Column: Copy & CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-start space-y-8"
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-semibold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            V1.0 LIVE ON CHROME WEB STORE
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400">
            Stop fronting the bill for your friends.
          </h1>
          
          <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed max-w-lg">
            The first multiplayer browser extension for group travel. Browse travel sites together, auto-split the costs at checkout, and generate instant payment requests before you book.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4">
            <button className="w-full sm:w-auto px-8 py-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.4)] group flex items-center justify-center gap-2">
              Add to Chrome — It's Free
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
            <span className="text-sm text-neutral-500 font-medium">
              No credit card required • 2MB extension
            </span>
          </div>
        </motion.div>

        {/* Right Column: Visual Product Mockup */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md mx-auto lg:ml-auto group"
        >
          {/* Main Glassmorphism Card */}
          <div className="relative bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 shadow-2xl z-20 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)]">
            
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4 mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">Goa Villa Split</h3>
                <p className="text-neutral-400 text-sm">4 Nights • 3 Guests</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl">₹30,000</p>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Ready to book</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* User 1 */}
              <div className="flex items-center justify-between bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/30">You</div>
                  <span className="text-neutral-200 text-sm font-medium">₹10,000</span>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded font-semibold border border-emerald-500/20">Paid</span>
              </div>

              {/* User 2 */}
              <div className="flex items-center justify-between bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/30">RS</div>
                  <span className="text-neutral-200 text-sm font-medium">₹10,000</span>
                </div>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded font-semibold border border-emerald-500/20">Paid</span>
              </div>

              {/* User 3 */}
              <div className="flex items-center justify-between bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50 border-l-2 border-l-yellow-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-500/5 animate-pulse"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-orange-500/30">AK</div>
                  <span className="text-neutral-200 text-sm font-medium">₹10,000</span>
                </div>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded font-semibold animate-pulse relative z-10 border border-yellow-500/20">Pending...</span>
              </div>
            </div>

            <button className="w-full mt-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 group-hover:border-white/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Copy Payment Link
            </button>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full blur-[40px] opacity-40 z-0 animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-[40px] opacity-30 z-0"></div>
        </motion.div>

      </div>
    </div>
  );
};

export default Hero;
