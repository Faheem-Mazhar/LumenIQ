import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Check } from 'lucide-react';
import { MOCK_DIGITAL_PLANS, MOCK_PHYSICAL_PLANS } from '../mockData';

interface PricingPlansProps {
  businessType: 'digital' | 'physical';
  onSelectPlan: (planId: string) => void;
  selectedPlan?: string;
}

export function PricingPlans({ businessType, onSelectPlan, selectedPlan }: PricingPlansProps) {
  const digitalPlans = MOCK_DIGITAL_PLANS;
  const physicalPlans = MOCK_PHYSICAL_PLANS;
  const plans = businessType === 'digital' ? digitalPlans : physicalPlans;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground">
          {businessType === 'digital' 
            ? 'Pricing for Digital Businesses'
            : 'Pricing for Physical Businesses'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`p-6 h-full flex flex-col relative ${
                plan.popular 
                  ? 'border-primary shadow-lg' 
                  : 'border-border'
              } ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-2">
                    {plan.period === 'custom' ? (
                      <div className="text-2xl font-bold text-foreground">Custom</div>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full mt-6 ${
                  plan.popular
                    ? 'gradient-blue-primary text-white hover:opacity-90'
                    : 'border border-primary text-primary hover:bg-primary/10'
                }`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.period === 'custom' ? 'Contact Sales' : 'Select Plan'}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
