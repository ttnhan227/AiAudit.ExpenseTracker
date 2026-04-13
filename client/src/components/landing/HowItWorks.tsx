import { Upload, Cpu, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Connect Your Data",
    description: "Integrate with your existing expense tools, credit cards, and accounting software in minutes.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analyzes Everything",
    description: "Our AI engine scans every transaction, receipt, and report for anomalies, duplicates, and policy violations.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Review & Act",
    description: "Get a prioritized list of flagged expenses with recommended actions. Approve or escalate in one click.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative bg-muted/45 py-24 dark:bg-muted/20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)/0.15),transparent_28%,transparent_72%,hsl(var(--background)/0.12))]" />
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How it <span className="text-gradient">works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get up and running in three simple steps.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.step} className="relative rounded-[1.8rem] border border-border/60 bg-card/80 p-8 text-center shadow-sm backdrop-blur" style={{ animation: `fade-in-up 0.6s ease-out ${i * 0.15}s forwards`, opacity: 0 }}>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_42px_-22px_hsl(var(--primary))]">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="mb-2 text-sm font-bold text-primary">{s.step}</div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
