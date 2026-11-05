import Link from "next/link";
import { BadgeCheck, CalendarCheck, CarFront, Headset, KeyRound, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { CarCard } from "@/components/CarCard";
import { FadeIn } from "@/components/FadeIn";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SearchWidget } from "@/components/SearchWidget";
import { SectionHeading, Stars, buttonCls } from "@/components/ui";
import { getActiveBanner, getCars, getFeaturedCars, getTestimonials } from "@/lib/data";
import { CATEGORIES, SITE } from "@/lib/config";
import { money } from "@/lib/utils";

const why = [
  { icon: ShieldCheck, title: "Fully insured fleet", text: "Every vehicle is serviced to manufacturer schedule and covered before it leaves our showroom." },
  { icon: Wallet, title: "Prices you can trust", text: "The total is calculated on our servers and shown before you confirm. No fees added at the desk." },
  { icon: CalendarCheck, title: "Live availability", text: "Dates you can pick are dates the car is actually free. Double bookings are blocked at the database." },
  { icon: Headset, title: "People on call", text: "A real person answers by phone or email, seven days a week." },
];
const steps = [
  { icon: CarFront, title: "Choose a vehicle", text: "Filter by category, seats, fuel and budget." },
  { icon: CalendarCheck, title: "Pick your dates", text: "See the total price for your exact pickup and return times." },
  { icon: BadgeCheck, title: "Send your request", text: "Create an account and submit. We confirm bookings, usually within the hour." },
  { icon: KeyRound, title: "Collect and drive", text: "Show your licence at pickup and the keys are yours." },
];

export default async function HomePage() {
  const [featured, cars, testimonials, banner] = await Promise.all([getFeaturedCars(), getCars(), getTestimonials(), getActiveBanner()]);
  const counts = new Map<string, { n: number; from: number }>();
  cars.forEach((c) => { const x = counts.get(c.category); counts.set(c.category, { n: (x?.n ?? 0) + 1, from: Math.min(x?.from ?? Infinity, c.price_per_day) }); });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero.svg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
        <div className="container-x relative pb-40 pt-16 sm:pt-24 lg:pb-44">
          <div className="max-w-2xl">
            <FadeIn><p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-white/80"><Sparkles size={15} className="text-gold" />{cars.length} hand-picked vehicles, ready to book</p></FadeIn>
            <FadeIn delay={0.08}><h1 className="font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">{SITE.tagline}</h1></FadeIn>
            <FadeIn delay={0.16}><p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">Premium cars, clear prices and a booking process that takes minutes. Choose your dates and see what is free.</p></FadeIn>
            <FadeIn delay={0.24} className="mt-8 flex flex-wrap gap-3">
              <Link href="/cars" className={buttonCls("gold", "lg")}>Browse the fleet</Link>
              <Link href="/#how-it-works" className="inline-flex items-center rounded-xl border border-white/25 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">How it works</Link>
            </FadeIn>
          </div>
        </div>
      </section>
      <div className="container-x relative z-10 -mt-28 lg:-mt-32"><SearchWidget /></div>

      {/* FEATURED */}
      <section className="container-x py-20">
        <SectionHeading title="Featured vehicles" text="Our most requested cars this season." action={<Link href="/cars" className={buttonCls("outline", "sm")}>See all vehicles</Link>} />
        {featured.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map((c) => <CarCard key={c.id} car={c} />)}</div>
        ) : <p className="text-slate-500">No featured vehicles yet. Mark vehicles as featured in the admin panel (Website tab).</p>}
      </section>

      {/* CATEGORIES */}
      <section className="bg-white py-20">
        <div className="container-x">
          <SectionHeading title="Popular categories" text="From city runabouts to executive saloons." />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            {CATEGORIES.map((c) => {
              const x = counts.get(c);
              return (
                <Link key={c} href={`/cars?category=${c}`} className="group rounded-2xl border border-slate-200 bg-surface p-5 transition hover:border-gold hover:bg-white hover:shadow-card">
                  <h3 className="text-lg">{c}</h3>
                  <p className="mt-1 text-sm text-slate-500">{x ? `${x.n} vehicle${x.n > 1 ? "s" : ""}` : "Coming soon"}</p>
                  {x && <p className="mt-3 text-xs text-slate-500">from <span className="font-semibold text-navy">{money(x.from)}</span>/day</p>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="why-us" className="container-x scroll-mt-20 py-20">
        <SectionHeading title="Why choose us" text="Rental should feel as good as the drive." />
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {why.map(({ icon: I, title, text }) => (
            <div key={title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold"><I size={20} /></span>
              <h3 className="mt-4 text-lg">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-16 bg-navy py-20 text-white">
        <div className="container-x">
          <h2 className="text-3xl text-white sm:text-4xl">How it works</h2>
          <p className="mt-2 text-white/70">Four steps from browsing to driving.</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: I, title, text }, i) => (
              <li key={title} className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between"><I className="text-gold" size={24} /><span className="font-display text-2xl text-white/30">{i + 1}</span></div>
                <h3 className="mt-5 text-lg text-white">{title}</h3>
                <p className="mt-1.5 text-sm text-white/70">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="container-x py-20">
          <SectionHeading title="What our customers say" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.slice(0, 4).map((t) => (
              <figure key={t.id} className="card flex flex-col p-6">
                <Stars value={t.rating} />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">{t.review}</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-navy">{t.customer_name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* PROMO */}
      {banner && (
        <section className="container-x pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gold p-8 sm:p-12">
            <div className="relative max-w-2xl">
              <h2 className="text-3xl text-navy sm:text-4xl">{banner.title}</h2>
              {banner.subtitle && <p className="mt-3 text-navy/80">{banner.subtitle}</p>}
              <Link href={banner.cta_href} className={`${buttonCls("primary", "lg")} mt-6`}>{banner.cta_label}</Link>
            </div>
            <CarFront aria-hidden className="absolute -bottom-6 -right-4 hidden text-navy/10 sm:block" size={220} strokeWidth={1} />
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      <section id="newsletter" className="scroll-mt-16 bg-navy-800 py-16 text-white">
        <div className="container-x flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-lg"><h2 className="text-3xl text-white">Offers in your inbox</h2><p className="mt-2 text-white/70">New vehicles and seasonal rates, about once a month. Unsubscribe any time.</p></div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
