1|export default function StudentsPage() {
2|  return (
3|    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
4|      <h1 className="text-4xl font-semibold text-white">For Students</h1>
5|      <p className="text-zinc-400 mt-3 max-w-2xl">Discover verified opportunities, track hours automatically, and level up with XP, streaks, and badges.</p>
6|      <div className="mt-10 grid md:grid-cols-2 gap-6">
7|        <div className="rounded-xl border border-white/10 bg-card/60 p-6">
8|          <h3 className="text-white font-medium">Find opportunities</h3>
9|          <p className="text-zinc-400 mt-2">Smart matching by location, skills, and availability.</p>
10|        </div>
11|        <div className="rounded-xl border border-white/10 bg-card/60 p-6">
12|          <h3 className="text-white font-medium">Log hours automatically</h3>
13|          <p className="text-zinc-400 mt-2">Check in/out with one tap; proof is auto-generated.</p>
14|        </div>
15|      </div>
16|      <div className="mt-10">
17|        <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-200 transition">Create your free account</a>
18|      </div>
19|    </main>
20|  );
21|}
