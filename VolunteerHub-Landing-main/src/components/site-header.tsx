1|"use client";
2|import Link from "next/link";
3|import { usePathname } from "next/navigation";
4|import { Sparkles } from "lucide-react";
5|
6|const container = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
7|
8|export default function SiteHeader() {
9|  const pathname = usePathname();
10|  const nav = [
11|    { label: "Home", href: "/" },
12|    { label: "Students", href: "/students" },
13|    { label: "Organizations", href: "/organizers" },
14|    { label: "Schools", href: "/schools" },
15|    { label: "Pricing", href: "/pricing" },
16|    { label: "Features", href: "/#features" },
17|    { label: "How it works", href: "/#how" },
18|  ];
19|
20|  return (
21|    <div className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-white/10">
22|      <div className={`${container} h-14 flex items-center justify-between`}>
23|        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-200">
24|          <span className="h-8 w-8 rounded-md bg-primary/20 border border-primary/30 grid place-items-center">
25|            <Sparkles className="h-4 w-4 text-primary" />
26|          </span>
27|          <span className="font-medium">StudentVol</span>
28|        </Link>
29|
30|        <nav className="hidden md:flex items-center gap-5 text-sm">
31|          {nav.map((item) => {
32|            const isActive =
33|              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("#")[0]);
34|            return (
35|              <Link
36|                key={item.href}
37|                href={item.href}
38|                className={`text-zinc-400 hover:text-zinc-200 transition ${isActive ? "text-zinc-100" : ""}`}
39|              >
40|                {item.label}
41|              </Link>
42|            );
43|          })}
44|        </nav>
45|
46|        <div className="flex items-center gap-2">
47|          <Link href="/signin" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/5 transition">Sign in</Link>
48|          <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3.5 py-1.5 text-sm font-medium hover:bg-zinc-200 transition">Get Started</Link>
49|        </div>
50|      </div>
51|    </div>
52|  );
53|}
