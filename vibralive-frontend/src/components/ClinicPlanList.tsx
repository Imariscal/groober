import React from 'react';

interface Plan {
  id: string;
  name: string;
  description: string;
}

interface ClinicPlanListProps {
  plans: Plan[];
}

export const ClinicPlanList: React.FC<ClinicPlanListProps> = ({ plans }) => {
  return (
    <div>
      <h2>Assigned Plans</h2>
      <ul>
        {plans.map((plan) => (
          <li key={plan.id}>
            {plan.name} - {plan.description}
          </li>
        ))}
      </ul>
    </div>
  );
};