import { ArrowRight, CheckCircle2, Clock, FileText, MapPin, Shield, Sparkles, Users, Zap, LineChart, BadgeCheck, CalendarClock, Download, Filter, ListChecks, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const container = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
const card = "bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60 rounded-2xl border border-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_30px_rgba(0,0,0,0.6)]";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,23,23,0.6),transparent_60%)]" />

        <div className={`${container} relative z-10 grid lg:grid-cols-2 gap-12 items-center pb-24 pt-10`}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Verified & safer opportunities
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white">
              One Marketplace for Verified Student Volunteering
            </h1>
            <p className="mt-4 text-zinc-400 text-lg max-w-xl">
              Discover opportunities. Track hours. Build your reputation.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button 
                onClick={() => navigate('/welcome')}
                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-200 transition"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => navigate('/welcome')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 hover:bg-white/5 transition"
              >
                For Organizations
              </button>
            </div>

            <div className="mt-6 flex items-center gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /><span>Verified hours</span></div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /><span>Gamified profiles</span></div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span>Safety & privacy</span></div>
            </div>
          </div>

          <div className={`${card} relative p-3 md:p-4`}>
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
              <img
                src="/app-preview.png"
                alt="App preview"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-primary/20 to-transparent blur-2xl" aria-hidden />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </section>

      {/* How It Works */}
      <section id="how" className="py-20">
        <div className={`${container}`}>
          <div className="grid md:grid-cols-3 gap-6">
            <HowCard
              title="For Students"
              items={[
                { icon: Clock, text: "Log hours automatically with check-in/out" },
                { icon: MapPin, text: "Find nearby opportunities" },
                { icon: Sparkles, text: "Earn XP, badges, and build reputation" },
              ]}
            />
            <HowCard
              title="For Organizers"
              items={[
                { icon: ListChecks, text: "Post and manage opportunities quickly" },
                { icon: Users, text: "Review applicants & verify hours in one click" },
                { icon: LineChart, text: "Track reliability and satisfaction" },
              ]}
            />
            <HowCard
              title="For Schools & Parents"
              items={[
                { icon: FileText, text: "Exportable proof of hours" },
                { icon: Shield, text: "Vetted organizers and safer listings" },
                { icon: BadgeCheck, text: "Ensure accountability and trust" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 border-t border-white/5 bg-gradient-to-b from-transparent to-white/[0.01]">
        <div className={`${container}`}>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-8">Core Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Feat icon={Filter} title="Smart Matching" desc="Get recommended roles based on skills, availability, and location" />
            <Feat icon={Sparkles} title="Gamified Profiles" desc="Level up with XP, streaks, and badges" />
            <Feat icon={CheckCircle2} title="Hour Verification" desc="Organizers approve attendance, proof is auto-logged" />
            <Feat icon={ListChecks} title="Organizer Tools" desc="Rosters, reminders, analytics, and bulk verification" />
            <Feat icon={Shield} title="Safety & Privacy" desc="Age-gated, vetted organizers, and guardian options" />
            <Feat icon={Download} title="Exportable Proof" desc="Download PDF/CSV logs for schools or applications" />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="py-20">
        <div className={`${container} grid lg:grid-cols-3 gap-6`}>
          <WhyCard title="For Students" bullets={[
            "All opportunities in one place",
            "Verified hours + easy reporting",
            "Gamified experience for motivation",
          ]} />
          <WhyCard title="For Organizers" bullets={[
            "Recruit faster with trusted applicants",
            "Simple applicant management",
            "One-click verification",
          ]} />
          <WhyCard title="For Schools & Parents" bullets={[
            "Transparent records",
            "Safer, vetted listings",
            "Exportable proof anytime",
          ]} />
        </div>
      </section>

      {/* Screenshots */}
      <section id="shots" className="py-20 border-y border-white/5 bg-black/20">
        <div className={`${container}`}>
          <div className="grid lg:grid-cols-3 gap-6">
            <MockCard title="Student Dashboard" />
            <MockCard title="Organizer Dashboard" />
            <MockCard title="Hour Log" />
          </div>
          <p className="text-center text-sm text-zinc-400 mt-6">Designed for students, trusted by schools, powered by organizers.</p>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="py-20">
        <div className={`${container} text-center`}>
          <h3 className="text-3xl font-semibold text-white">Start Building Your Volunteering Journey Today</h3>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => navigate('/welcome')}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-200 transition"
            >
              Sign Up as a Student
              <ArrowRight className="h-4 w-4"/>
            </button>
            <button 
              onClick={() => navigate('/welcome')}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 hover:bg-white/5 transition"
            >
              Post an Opportunity
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-sm text-zinc-400">
        <div className={`${container} flex flex-col md:flex-row items-center justify-between gap-4`}>
          <nav className="flex flex-wrap items-center gap-5">
            <button onClick={() => navigate('/')} className="hover:text-zinc-200 transition">Home</button>
            <button onClick={() => navigate('/welcome')} className="hover:text-zinc-200 transition">About</button>
            <button onClick={() => navigate('/welcome')} className="hover:text-zinc-200 transition">Privacy</button>
            <button onClick={() => navigate('/welcome')} className="hover:text-zinc-200 transition">Terms</button>
            <button onClick={() => navigate('/welcome')} className="hover:text-zinc-200 transition">Contact</button>
          </nav>
          <p className="text-zinc-500">© 2025 StudentVol. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function HowCard({ title, items }: { title: string; items: { icon: React.ComponentType<{ className?: string }>; text: string }[] }) {
  return (
    <div className={`${card} p-6`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex items-start gap-3 text-zinc-300">
            <div className="h-6 w-6 rounded-md bg-white/5 border border-white/10 grid place-items-center shrink-0">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="leading-snug">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Feat({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className={`${card} p-6`}>
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-white font-medium">{title}</h4>
          <p className="text-zinc-400 text-sm mt-1">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function WhyCard({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <div className={`${card} p-6`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3 text-zinc-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
            <span className="leading-snug">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockCard({ title }: { title: string }) {
  return (
    <div className={`${card} p-3`}>
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
        <img
          src="/app-preview.png"
          alt={title}
          className="w-full h-auto object-cover"
        />
      </div>
      <div className="px-2 py-3">
        <p className="text-sm text-zinc-300">{title}</p>
      </div>
    </div>
  );
}

