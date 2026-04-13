import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small teams getting started with AI auditing.",
    features: [
      "Up to 500 expenses/month",
      "AI categorization",
      "Basic receipt scanning",
      "Email support",
      "1 user seat",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$79",
    period: "/month",
    description: "For growing teams that need advanced audit capabilities.",
    features: [
      "Up to 5,000 expenses/month",
      "Advanced anomaly detection",
      "Unlimited receipt scanning",
      "Priority support",
      "10 user seats",
      "Custom audit reports",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations with complex needs.",
    features: [
      "Unlimited expenses",
      "Custom AI models",
      "SSO & SAML",
      "Dedicated account manager",
      "Unlimited seats",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to register
      navigate("/register");
    } else {
      // Redirect to subscription page
      navigate(`/subscription?plan=${planId}`);
    }
  };

  return (
    <section id="pricing" className="relative py-24">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(circle_at_bottom,_hsl(var(--primary)/0.07),_transparent_58%)] dark:bg-[radial-gradient(circle_at_bottom,_hsl(var(--primary)/0.12),_transparent_58%)]" />
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Simple, transparent{" "}
            <span className="text-gradient">pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free. Upgrade when you're ready. No hidden fees.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
                tier.popular
                  ? "scale-[1.02] rounded-[1.9rem] border-primary bg-card/95 shadow-xl shadow-primary/15"
                  : "rounded-[1.8rem] border-border/60 bg-card/85 shadow-sm backdrop-blur hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              }`}
              style={{ animation: `fade-in-up 0.6s ease-out ${i * 0.1}s forwards`, opacity: 0 }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-[0_16px_36px_-20px_hsl(var(--primary))]">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-xl font-bold text-foreground">{tier.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{tier.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(tier.id)}
                className={`w-full gap-2 rounded-full ${
                  tier.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                    : "bg-secondary/85 text-secondary-foreground hover:bg-secondary"
                }`}
                size="lg"
              >
                {tier.cta} {tier.popular && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
