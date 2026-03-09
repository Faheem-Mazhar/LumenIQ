import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';
import { type PlanStream, MOCK_PLAN_STREAMS } from '../mockData';

const defaultPlanStreams = MOCK_PLAN_STREAMS;

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  streams?: PlanStream[];
}

export function PlanSelectionModal({
  open,
  onOpenChange,
  currentPlanId,
  onSelectPlan,
  streams = defaultPlanStreams
}: PlanSelectionModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(currentPlanId);

  const flattenedPlans = useMemo(() => streams.flatMap((stream) => stream.plans), [streams]);
  const selectedPlan = flattenedPlans.find((plan) => plan.id === selectedPlanId);

  const handleSelect = (planId: string) => {
    if (planId === currentPlanId) {
      setSelectedPlanId(planId);
      return;
    }
    setSelectedPlanId(planId);
    onSelectPlan?.(planId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-outfit text-slate-900">Choose a plan</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Select the plan that fits your business stream and scale.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          {streams.map((stream) => (
            <div key={stream.id} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3">
                <div>
                  <div className="text-xs font-outfit uppercase tracking-wide text-blue-600">
                    {stream.title}
                  </div>
                  <div className="text-sm font-medium text-slate-700">{stream.subtitle}</div>
                </div>
                <span className="text-xs text-slate-500">{stream.plans.length} options</span>
              </div>

              <div className="space-y-3">
                {stream.plans.map((plan) => {
                  const isCurrentPlan = currentPlanId === plan.id;
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <Card
                      key={plan.id}
                      className={`rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-blue-400 bg-blue-50/60 shadow-sm'
                          : 'border-slate-200/70 bg-white/90 hover:border-blue-300'
                      }`}
                    >
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-outfit text-slate-900">{plan.name}</h4>
                              {isCurrentPlan && (
                                <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-xs font-medium text-blue-700">
                                  Current
                                </span>
                              )}
                            </div>
                            {plan.description && (
                              <p className="text-sm text-slate-600">{plan.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-outfit text-slate-900">{plan.priceLabel}</div>
                            {!plan.isEnterprise && <div className="text-xs text-slate-500">per month</div>}
                          </div>
                        </div>

                        {plan.features && plan.features.length > 0 && (
                          <ul className="space-y-2">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                                <Check className="mt-0.5 h-4 w-4 text-blue-600" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => setSelectedPlanId(plan.id)}
                          >
                            {isSelected ? 'Selected' : 'Preview'}
                          </Button>
                          <Button
                            size="sm"
                            className={`${
                              plan.isEnterprise
                                ? 'border border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                                : 'gradient-blue-primary text-white hover:opacity-90'
                            }`}
                            onClick={() => handleSelect(plan.id)}
                            disabled={isCurrentPlan}
                          >
                            {isCurrentPlan
                              ? 'Current plan'
                              : plan.isEnterprise
                                ? 'Contact sales'
                                : 'Select plan'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            Selected: <span className="font-medium text-slate-900">{selectedPlan.name}</span>
            {' '}({selectedPlan.priceLabel})
          </div>
        )}

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
