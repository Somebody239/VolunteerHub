1|export default function OrganizersPage() {
2|  return (
3|    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
4|      <h1 className="text-4xl font-semibold text-white">For Organizations</h1>
5|      <p className="text-zinc-400 mt-3 max-w-2xl">Post roles, manage applicants, verify hours in one click, and track reliability.</p>
6|      <div className="mt-10 grid md:grid-cols-2 gap-6">
7|        <div className="rounded-xl border border-white/10 bg-card/60 p-6">
8|          <h3 className="text-white font-medium">Fast posting</h3>
9|          <p className="text-zinc-400 mt-2">Create opportunities in minutes with templates.</p>
10|        </div>
11|        <div className="rounded-xl border border-white/10 bg-card/60 p-6">
12|          <h3 className="text-white font-medium">One‑click verification</h3>
13|          <p className="text-zinc-400 mt-2">Approve attendance and auto‑generate proof logs.</p>
14|        </div>
15|      </div>
16|      <div className="mt-10">
17|        <a href="/signup" className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-medium hover:bg-zinc-200 transition">Post an opportunity</a>
18|      </div>
19|    </main>
20|  );
21|}
}  }  }
