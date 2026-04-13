import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Star, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const stats = [
  { value: "10K+", label: "Expenses Audited Daily" },
  { value: "98%", label: "Accuracy Rate" },
  { value: "12hrs", label: "Saved Per Week" },
  { value: "500+", label: "Companies Trust Us" },
];

const Hero = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartTrial = () => {
    if (isAuthenticated) {
      navigate("/subscription?plan=professional");
    } else {
      navigate("/register");
    }
  };

  return (
    <section className="relative overflow-hidden bg-hero pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,hsl(var(--background)/0.45)_100%)] dark:bg-[linear-gradient(180deg,transparent_0%,hsl(var(--background)/0.18)_100%)]" />
      {/* Glow orbs */}
      <div className="pointer-events-none absolute top-20 left-1/4 h-96 w-96 rounded-full bg-glow-primary/10 blur-3xl" style={{ animation: "pulse-glow 4s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-glow-secondary/10 blur-3xl" style={{ animation: "pulse-glow 4s ease-in-out infinite 1s" }} />

      <div className="container relative mx-auto px-4 pb-20 pt-24 md:pt-32">
        <div className="mx-auto max-w-3xl text-center" style={{ animation: "fade-in-up 0.8s ease-out forwards" }}>
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/70 px-4 py-1.5 text-sm text-foreground/85 shadow-[0_10px_40px_-28px_hsl(var(--primary))] backdrop-blur-sm dark:border-primary-foreground/15 dark:bg-primary-foreground/8 dark:text-primary-foreground/90">
            <Shield className="h-4 w-4" />
            Trusted by 500+ Finance Teams
            <span className="flex items-center gap-0.5" style={{ color: "hsl(45 93% 58%)" }}>
              <Star className="h-3 w-3 fill-current" />
              <Star className="h-3 w-3 fill-current" />
              <Star className="h-3 w-3 fill-current" />
              <Star className="h-3 w-3 fill-current" />
              <Star className="h-3 w-3 fill-current" />
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl dark:text-primary-foreground">
            Audit Every Expense.{" "}
            <span className="text-gradient">Automatically.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-foreground/75 dark:text-primary-foreground/72">
            Stop manual expense reviews. Our AI scans, categorizes, and flags anomalies in real-time — saving your finance team hours every week.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 shadow-[0_18px_48px_-20px_hsl(var(--primary))]" onClick={handleStartTrial}>
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 rounded-full border-foreground/20 bg-background/60 px-8 text-foreground hover:bg-background/85 backdrop-blur-sm dark:border-primary-foreground/20 dark:bg-primary-foreground/5 dark:text-primary-foreground dark:hover:bg-primary-foreground/10">
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </div>
        </div>

        {/* Stats showcase */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="rounded-[1.75rem] border border-foreground/10 bg-background/70 p-5 text-center shadow-[0_16px_40px_-32px_rgba(0,0,0,0.25)] backdrop-blur-sm dark:border-primary-foreground/10 dark:bg-primary-foreground/6 dark:shadow-[0_16px_40px_-32px_rgba(0,0,0,0.6)]"
                style={{ animation: `fade-in-up 0.6s ease-out ${0.3 + i * 0.1}s forwards`, opacity: 0 }}
              >
                <div className="text-2xl font-extrabold text-primary md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-foreground/65 md:text-sm dark:text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof avatars */}
        <div className="mt-10 flex items-center justify-center gap-3" style={{ animation: "fade-in-up 0.8s ease-out 0.7s forwards", opacity: 0 }}>
          <div className="flex -space-x-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-hero bg-primary/20 text-xs font-bold text-primary">
                <Users className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground/65 dark:text-primary-foreground/60">
            Join <span className="font-semibold text-foreground/80 dark:text-primary-foreground/70">2,000+</span> finance professionals
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
