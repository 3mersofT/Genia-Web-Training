'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { X, Download, Share2, Award, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CertificateData } from '@/lib/certificates/generator';

interface CertificatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  certificateData: CertificateData;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function CertificatePreview({
  isOpen,
  onClose,
  certificateData,
  onDownload,
  onShare
}: CertificatePreviewProps) {
  const t = useTranslations('certificates.preview');
  const {
    studentName,
    moduleTitle,
    completionDate,
    score,
    qrCodeDataUrl,
    certificateType,
    verificationCode
  } = certificateData;

  const formattedDate = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const certificateTitle = certificateType === 'master'
    ? 'MASTER CERTIFICATE OF COMPLETION'
    : 'CERTIFICATE OF COMPLETION';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
                  <p className="text-blue-100 mt-1">{t('subtitle')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Certificate Preview */}
          <div className="p-8">
            {/* Certificate Container - Landscape A4 aspect ratio */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-4 border-indigo-600 rounded-lg shadow-xl mx-auto"
                 style={{ aspectRatio: '297/210', maxWidth: '100%' }}>

              {/* Inner Border */}
              <div className="border-2 border-purple-400 m-2 h-[calc(100%-16px)] rounded-md relative p-8 flex flex-col">

                {/* Top Accent Bar */}
                <div className="absolute top-0 left-4 right-4 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full" />

                {/* Header Section */}
                <div className="text-center mb-6">
                  <h1 className="text-4xl font-bold text-indigo-600 mb-2">GENIA</h1>
                  <p className="text-sm text-slate-500">AI-Powered Learning Platform</p>
                </div>

                {/* Certificate Title */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{certificateTitle}</h2>
                  <div className="w-32 h-0.5 bg-amber-500 mx-auto" />
                </div>

                {/* Certificate Body */}
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                  <p className="text-sm text-slate-600">This is to certify that</p>

                  {/* Student Name */}
                  <div>
                    <h3 className="text-3xl font-bold italic text-indigo-600 mb-1">{studentName}</h3>
                    <div className="w-64 h-0.5 bg-purple-400 mx-auto" />
                  </div>

                  <p className="text-sm text-slate-600">has successfully completed</p>

                  {/* Module Title */}
                  <h4 className="text-xl font-bold text-slate-800 px-8 max-w-3xl">{moduleTitle}</h4>

                  {/* Details Section */}
                  <div className="grid grid-cols-2 gap-8 mt-6 w-full max-w-2xl px-8">
                    {/* Completion Date */}
                    <div className="text-left">
                      <p className="text-xs text-slate-600 mb-1">Completion Date:</p>
                      <p className="text-sm font-semibold text-slate-800">{formattedDate}</p>
                    </div>

                    {/* Achievement Score */}
                    <div className="text-left">
                      <p className="text-xs text-slate-600 mb-1">Achievement Score:</p>
                      <p className="text-2xl font-bold text-amber-500">{score}%</p>
                    </div>
                  </div>
                </div>

                {/* QR Code Section - Positioned absolutely in bottom right */}
                <div className="absolute bottom-8 right-8 text-center">
                  <p className="text-xs text-slate-500 mb-2">Verify Certificate:</p>
                  {qrCodeDataUrl && (
                    <div className="bg-white p-2 rounded shadow-sm">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code de vérification"
                        className="w-24 h-24 mx-auto"
                      />
                    </div>
                  )}
                  {verificationCode && (
                    <p className="text-xs font-mono text-slate-600 mt-2">{verificationCode}</p>
                  )}
                </div>

                {/* Footer Section */}
                <div className="mt-auto pt-6 grid grid-cols-2 gap-16 max-w-2xl mx-auto w-full">
                  {/* Signature Line */}
                  <div className="text-center">
                    <div className="border-t border-slate-400 mb-2" />
                    <p className="text-xs text-slate-500">Platform Administrator</p>
                  </div>

                  {/* Issue Date */}
                  <div className="text-center">
                    <div className="border-t border-slate-400 mb-2" />
                    <p className="text-xs text-slate-500">Date of Issue</p>
                  </div>
                </div>

                {/* Bottom Branding */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-xs text-purple-600 mb-1">
                    This certificate validates skills in AI-powered prompt engineering
                  </p>
                  <p className="text-xs text-slate-500">www.genia.com</p>
                </div>

                {/* Verified Badge - Top Right */}
                <div className="absolute top-8 right-8 flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">{t('verified')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              {/* Download PDF Button */}
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <Download className="w-5 h-5" />
                {t('downloadPDF')}
              </button>

              {/* Share to LinkedIn Button */}
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0077B5] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  {t('shareLinkedIn')}
                </button>
              )}
            </div>

            {/* Info Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {t('authenticInfo')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
