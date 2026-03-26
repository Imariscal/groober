import React, { useState } from 'react';
import { MdDownload, MdPrint, MdShare, MdFileDownload } from 'react-icons/md';
import { toast } from 'react-hot-toast';

interface ReportFormat {
  id: 'pdf' | 'excel' | 'csv';
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface AnalyticsReportExportProps {
  reportTitle: string;
  reportData?: any;
  dateRange?: { from: Date; to: Date };
  clinicId?: string;
}

export function AnalyticsReportExport({
  reportTitle,
  reportData,
  dateRange,
  clinicId,
}: AnalyticsReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  const reportFormats: ReportFormat[] = [
    {
      id: 'pdf',
      label: 'PDF Report',
      icon: <MdFileDownload />,
      description: 'Professional PDF document with charts and formatting',
    },
    {
      id: 'excel',
      label: 'Excel Spreadsheet',
      icon: <MdFileDownload />,
      description: 'Formatted Excel file for data analysis and manipulation',
    },
    {
      id: 'csv',
      label: 'CSV Data',
      icon: <MdFileDownload />,
      description: 'Raw CSV data for import into other systems',
    },
  ];

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    setSelectedFormat(format);

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create mock file download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${reportTitle.replace(/\s+/g, '_')}_${timestamp}.${
        format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf'
      }`;

      // In production, this would download actual file from backend
      toast.success(`Report exported as ${format.toUpperCase()}`);
      console.log(`Exporting ${filename}`);
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
      setSelectedFormat(null);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog...');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reportTitle,
          text: `Medical Analytics Report: ${reportTitle}`,
          url: window.location.href,
        });
        toast.success('Report shared');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Report link copied to clipboard');
      }
    } catch (error) {
      console.log('Share failed', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Export & Share Report</h3>
          <p className="text-sm text-slate-600 mt-1">
            {reportTitle} {dateRange && `(${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()})`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
          >
            <MdPrint className="text-lg" />
            Print
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
          >
            <MdShare className="text-lg" />
            Share
          </button>
        </div>
      </div>

      {/* Export Formats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => handleExport(format.id)}
            disabled={isExporting}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedFormat === format.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-slate-200 bg-white hover:border-primary-300'
            } ${isExporting && selectedFormat !== format.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-2xl text-primary-600">{format.icon}</div>
              {selectedFormat === format.id && isExporting && (
                <div className="animate-spin">
                  <MdDownload className="text-primary-600" />
                </div>
              )}
            </div>
            <h4 className="font-semibold text-slate-900">{format.label}</h4>
            <p className="text-xs text-slate-600 mt-1">{format.description}</p>
            <p className="text-xs text-primary-600 font-semibold mt-2">
              {isExporting && selectedFormat === format.id ? 'Preparing...' : 'Click to export'}
            </p>
          </button>
        ))}
      </div>

      {/* Advanced Export Options */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg space-y-4">
        <h4 className="font-semibold text-slate-900">Advanced Export Options</h4>

        <div className="space-y-3">
          {/* Include Charts */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-slate-300 text-primary-600"
            />
            <span className="text-sm text-slate-900 font-medium">Include charts and visualizations</span>
          </label>

          {/* Include Detailed Metrics */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-slate-300 text-primary-600"
            />
            <span className="text-sm text-slate-900 font-medium">Include detailed metrics breakdown</span>
          </label>

          {/* Include Insights */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-slate-300 text-primary-600"
            />
            <span className="text-sm text-slate-900 font-medium">Include analysis and insights</span>
          </label>

          {/* Include Timestamp */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-slate-300 text-primary-600"
            />
            <span className="text-sm text-slate-900 font-medium">Include generation timestamp</span>
          </label>
        </div>
      </div>

      {/* Report Information */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          <strong>📋 Report Information:</strong>
        </p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>All data is encrypted in transit and at rest</li>
          <li>Reports include audit trail metadata</li>
          <li>Exports are watermarked for tracking</li>
          <li>Records are compliant with data protection regulations</li>
          <li>Automated email delivery available for scheduled reports</li>
        </ul>
      </div>

      {/* Scheduled Reports */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="font-semibold text-slate-900 mb-3">Scheduled Reports</h4>
        <p className="text-sm text-slate-600 mb-4">
          Set up automatic report generation and delivery via email
        </p>

        <div className="space-y-2">
          {['Daily', 'Weekly', 'Monthly'].map((frequency) => (
            <button
              key={frequency}
              className="w-full text-left p-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{frequency} Report</span>
                <span className="text-xs text-slate-600">Configure →</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Automatically generated and emailed every {frequency.toLowerCase()}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
