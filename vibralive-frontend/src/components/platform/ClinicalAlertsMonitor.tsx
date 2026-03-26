import React, { useState } from 'react';
import { MdWarning, MdCheckCircle, MdInfo, MdTrendingDown } from 'react-icons/md';

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  dismissible?: boolean;
}

interface ClinicalAlertData {
  overdueVaccinations: number;
  allergyClashes: number;
  incompleteMedicalRecords: number;
  prescriptionRefillNeeded: number;
  unverifiedRecords: number;
}

interface ClinicalAlertsMonitorProps {
  alerts?: Alert[];
  alertData?: ClinicalAlertData;
}

export function ClinicalAlertsMonitor({
  alerts = [],
  alertData,
}: ClinicalAlertsMonitorProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Mock clinical alerts based on data
  const generateAlerts = (): Alert[] => {
    if (!alertData) return alerts;

    const generatedAlerts: Alert[] = [];

    if (alertData.overdueVaccinations > 0) {
      generatedAlerts.push({
        id: 'vaccines',
        type: 'warning',
        title: 'Overdue Vaccinations',
        message: `${alertData.overdueVaccinations} pets have overdue vaccinations that need attention. System will send reminders automatically.`,
        action: 'View Overdue List',
        dismissible: false,
      });
    }

    if (alertData.allergyClashes > 0) {
      generatedAlerts.push({
        id: 'allergies',
        type: 'critical',
        title: '⚠️ Potential Allergy Clashes Detected',
        message: `${alertData.allergyClashes} prescriptions may have medication allergy conflicts. Review immediately before dispensing.`,
        action: 'Review Conflicts',
        dismissible: false,
      });
    }

    if (alertData.incompleteMedicalRecords > 0) {
      generatedAlerts.push({
        id: 'incomplete',
        type: 'info',
        title: 'Incomplete Medical Records',
        message: `${alertData.incompleteMedicalRecords} medical visits are missing required information. Complete them within 30 days per regulations.`,
        action: 'Complete Records',
        dismissible: true,
      });
    }

    if (alertData.unverifiedRecords > 0) {
      generatedAlerts.push({
        id: 'unsigned',
        type: 'warning',
        title: 'Unsigned Medical Records',
        message: `${alertData.unverifiedRecords} medical records need digital signatures to be legally binding. Veterinarians must sign within 7 days.`,
        action: 'Sign Records',
        dismissible: false,
      });
    }

    if (alertData.prescriptionRefillNeeded > 0) {
      generatedAlerts.push({
        id: 'refills',
        type: 'info',
        title: '💊 Prescription Refills Needed',
        message: `${alertData.prescriptionRefillNeeded} active prescriptions are approaching their final refill. Consider renewal if recommended.`,
        action: 'Review Prescriptions',
        dismissible: true,
      });
    }

    return generatedAlerts;
  };

  const displayAlerts = generateAlerts();
  const activeAlerts = displayAlerts.filter((a) => !dismissedAlerts.includes(a.id));

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const getAlertConfig = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          icon: <MdWarning />,
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          badge: 'bg-red-100 text-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          icon: <MdWarning />,
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          badge: 'bg-amber-100 text-amber-700',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          icon: <MdCheckCircle />,
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          badge: 'bg-green-100 text-green-700',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          icon: <MdInfo />,
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-700',
        };
    }
  };

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
        <div className="flex items-center justify-center gap-3">
          <MdCheckCircle className="text-4xl text-green-600" />
          <div>
            <h3 className="text-lg font-bold text-green-900">All Systems Healthy</h3>
            <p className="text-sm text-green-800 mt-1">
              No clinical alerts at this time. Clinic operations are running smoothly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = activeAlerts.filter((a) => a.type === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.type === 'warning').length;

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="flex items-center gap-4 p-4 bg-slate-900 text-white rounded-lg">
          <div className="text-3xl">
            <MdTrendingDown />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">
              {criticalCount > 0
                ? `⚠️ ${criticalCount} Critical Alert${criticalCount > 1 ? 's' : ''}`
                : `${warningCount} Warning${warningCount > 1 ? 's' : ''}`}
            </p>
            <p className="text-sm text-slate-300">Requires immediate attention</p>
          </div>
          <span className="text-sm font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-full">
            {activeAlerts.length} Total
          </span>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {activeAlerts.map((alert) => {
          const config = getAlertConfig(alert.type);
          const isExpanded = expandedAlert === alert.id;

          return (
            <div
              key={alert.id}
              className={`${config.bg} border-l-4 ${config.border} rounded-r-lg overflow-hidden transition-all`}
            >
              <div
                className="p-4 cursor-pointer flex items-start justify-between gap-3"
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`text-2xl flex-shrink-0 ${config.iconColor}`}>{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold ${config.titleColor}`}>{alert.title}</h4>
                    {!isExpanded && (
                      <p className="text-sm text-slate-700 mt-1 line-clamp-2">{alert.message}</p>
                    )}
                    {isExpanded && <p className="text-sm text-slate-700 mt-1">{alert.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {alert.action && (
                    <button className={`text-xs font-bold px-3 py-1 rounded ${config.badge} hover:opacity-80 transition-opacity`}>
                      {alert.action}
                    </button>
                  )}
                  {alert.dismissible && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissAlert(alert.id);
                      }}
                      className="text-xl text-slate-500 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && alert.action && (
                <div className="px-4 pb-3 pt-0 border-t border-current border-opacity-20">
                  <button className={`w-full text-left text-sm font-semibold py-2 px-3 rounded ${config.badge} hover:opacity-90 transition-opacity`}>
                    → {alert.action}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">
            {activeAlerts.filter((a) => a.type === 'critical').length}
          </p>
          <p className="text-xs text-red-700 font-medium">Critical</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-amber-600">
            {activeAlerts.filter((a) => a.type === 'warning').length}
          </p>
          <p className="text-xs text-amber-700 font-medium">Warnings</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">
            {activeAlerts.filter((a) => a.type === 'info').length}
          </p>
          <p className="text-xs text-blue-700 font-medium">Notices</p>
        </div>
      </div>
    </div>
  );
}
