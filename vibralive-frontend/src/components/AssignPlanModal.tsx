import React, { useState } from 'react';

interface AssignPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: any; // Replace `any` with the appropriate type for your clinic object
  onPlanAssigned: () => void;
}

export const AssignPlanModal: React.FC<AssignPlanModalProps> = ({
  isOpen,
  onClose,
  clinic,
  onPlanAssigned,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const handleAssign = async () => {
    try {
      await fetch(`/api/clinics/${clinic.id}/assign-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      onPlanAssigned();
      onClose();
    } catch (error) {
      console.error('Failed to assign plan:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Assign Plan to {clinic.name}</h2>
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
        >
          <option value="">Select a plan</option>
          {/* Replace with dynamic plan options */}
          <option value="plan1">Plan 1</option>
          <option value="plan2">Plan 2</option>
        </select>
        <button onClick={handleAssign}>Assign</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};