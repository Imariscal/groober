import React from 'react';
import { MdVerified, MdDownload, MdWarning } from 'react-icons/md';

interface SignatureVerificationCardProps {
  visitId: string;
  signatureData?: string;
  signedBy?: string;
  signedAt?: string;
  verificationStatus?: 'valid' | 'invalid' | 'unverified';
  className?: string;
}

export function SignatureVerificationCard({
  visitId,
  signatureData,
  signedBy,
  signedAt,
  verificationStatus = 'valid',
  className = '',
}: SignatureVerificationCardProps) {
  const handleDownloadSignature = () => {
    if (!signatureData) return;

    const link = document.createElement('a');
    link.href = signatureData;
    link.download = `signature-${visitId}-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusConfig = () => {
    switch (verificationStatus) {
      case 'valid':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeBg: 'bg-green-100',
          badgeText: 'text-green-700',
          icon: <MdVerified className="text-green-600" />,
          label: 'Verified Signature',
          description: 'This medical record has been digitally signed and verified.',
        };
      case 'invalid':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          icon: <MdWarning className="text-red-600" />,
          label: 'Signature Invalid',
          description: 'This signature could not be verified. Record integrity may be compromised.',
        };
      default:
        return {
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-700',
          icon: <MdWarning className="text-amber-600" />,
          label: 'Unverified',
          description: 'This record has not been digitally signed yet.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 ${className}`}>
      {/* Header with Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-xl">{config.icon}</div>
          <div>
            <h3 className={`font-semibold inline-block px-3 py-1 rounded-full ${config.badgeBg} ${config.badgeText} text-sm`}>
              {config.label}
            </h3>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm mb-4 ${config.badgeText.replace('text-', 'text-opacity-75 text-')}`}>
        {config.description}
      </p>

      {/* Signature Details */}
      {signatureData && verificationStatus === 'valid' && (
        <div className="space-y-3">
          {/* Signature Preview */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white p-3">
            <img
              src={signatureData}
              alt="Digital signature"
              className="w-full h-24 object-contain"
            />
          </div>

          {/* Signer Information */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {signedBy && (
              <div>
                <p className="text-slate-600 text-xs">Signed By</p>
                <p className="font-semibold text-slate-900">{signedBy}</p>
              </div>
            )}
            {signedAt && (
              <div>
                <p className="text-slate-600 text-xs">Timestamp</p>
                <p className="font-semibold text-slate-900">
                  {new Date(signedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadSignature}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700"
          >
            <MdDownload className="text-lg" />
            Download Signature
          </button>

          {/* Audit Trail Info */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">Audit Trail Information:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Signature captured on {signedAt ? new Date(signedAt).toLocaleDateString() : 'N/A'}</li>
              <li>Record ID: {visitId}</li>
              <li>Digitally signed and legally binding</li>
              <li>Cannot be modified after signing</li>
            </ul>
          </div>
        </div>
      )}

      {/* Unsigned State */}
      {!signatureData && verificationStatus === 'unverified' && (
        <div className="p-3 bg-white bg-opacity-50 rounded-lg">
          <p className="text-sm text-slate-700">
            This medical record is complete but hasn't been signed yet. Only veterinarians with proper
            credentials can sign medical records.
          </p>
        </div>
      )}

      {/* Invalid Signature State */}
      {verificationStatus === 'invalid' && (
        <div className="p-3 bg-white bg-opacity-50 rounded-lg space-y-2">
          <p className="text-sm font-semibold text-red-700">
            ⚠️ Signature Verification Failed
          </p>
          <p className="text-xs text-red-600">
            This record may have been tampered with or corrupted. Please contact system administrator
            immediately and do not rely on this record for medical decisions.
          </p>
        </div>
      )}
    </div>
  );
}
