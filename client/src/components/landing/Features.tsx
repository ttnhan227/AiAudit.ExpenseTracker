import { Brain, Receipt, FileBarChart, Sparkles, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Categorization",
    description: "Machine learning automatically categorizes expenses, detects duplicates, and flags policy violations with 98% accuracy.",
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    icon: Receipt,
    title: "Smart Receipt Scanning",
    description: "Upload any receipt — our OCR extracts vendor, amount, date, and category in seconds. No manual data entry needed.",
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    icon: FileBarChart,
    title: "Audit Reports",
    description: "Generate comprehensive audit reports with one click. Track trends, anomalies, and compliance metrics over time.",
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    icon: Sparkles,
    title: "Anomaly Detection",
    description: "AI continuously monitors spending for unusual patterns, potential fraud, and out-of-policy expenses in real-time.",
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    icon: ShieldCheck,
    title: "Policy Compliance",
    description: "Automatically enforce spending policies across your organization. Get instant alerts when limits are exceeded.",
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Process thousands of expenses in seconds. Accelerate your monthly close by up to 80% with automated workflows.",
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary group-hover:text-primary-foreground",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.08),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_60%)]" />
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-4 py-1.5 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Powerful Features
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything you need to{" "}
            <span className="text-gradient">audit smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful AI tools that transform how your finance team handles expense management.
          </p>
        </div>

        {/* Top 3 featured cards — larger */}
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {features.slice(0, 3).map((feature, i) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-[1.9rem] border border-border/60 bg-card/85 p-8 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
              style={{ animation: `fade-in-up 0.6s ease-out ${i * 0.1}s forwards`, opacity: 0 }}
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 transition-all group-hover:scale-110 group-hover:bg-primary/10" />
              <div className={`relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${feature.color} transition-colors ${feature.hoverColor}`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom 3 cards */}
        <div className="mx-auto mt-6 grid max-w-5xl gap-6 md:grid-cols-3">
          {features.slice(3).map((feature, i) => (
            <div
              key={feature.title}
              className="group rounded-[1.7rem] border border-border/60 bg-card/85 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
              style={{ animation: `fade-in-up 0.6s ease-out ${(i + 3) * 0.1}s forwards`, opacity: 0 }}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} transition-colors ${feature.hoverColor}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
