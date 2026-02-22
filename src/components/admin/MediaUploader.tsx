'use client';

import React, { useState, useRef } from 'react';
import {
  Upload, X, Image as ImageIcon, FileText, Check, AlertCircle,
  Loader2, Copy, CheckCircle2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MediaUploaderProps {
  onUploadComplete?: (url: string) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  bucketName?: string;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export default function MediaUploader({
  onUploadComplete,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  maxSizeMB = 10,
  bucketName = 'content-media'
}: MediaUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Type de fichier non accepté. Types acceptés: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Fichier trop volumineux. Taille maximale: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      setUploadProgress(100);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const uploadedFile: UploadedFile = {
        name: selectedFile.name,
        url: publicUrl,
        type: selectedFile.type,
        size: selectedFile.size
      };

      setUploadedFiles([uploadedFile, ...uploadedFiles]);

      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }

      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      setError('Impossible de copier l\'URL');
    }
  };

  const handleRemoveFile = (url: string) => {
    setUploadedFiles(uploadedFiles.filter(file => file.url !== url));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-600" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📎 Upload de Médias</h3>
          <p className="text-sm text-gray-600 mt-1">
            Images et PDFs pour enrichir vos capsules
          </p>
        </div>
      </div>

      {/* File Selection Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          className="hidden"
          id="file-upload"
        />

        {!selectedFile ? (
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-1">
              Cliquez pour sélectionner un fichier
            </p>
            <p className="text-sm text-gray-500">
              Images (JPG, PNG, GIF, WebP) ou PDF • Max {maxSizeMB}MB
            </p>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 bg-blue-50 rounded-lg p-4">
              {getFileIcon(selectedFile.type)}
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 hover:bg-blue-100 rounded"
                disabled={isUploading}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Upload en cours...</span>
                  <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Uploader le fichier
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Fichiers uploadés ({uploadedFiles.length})
          </h4>

          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.url}
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3"
              >
                {getFileIcon(file.type)}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-600 truncate">{file.url}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyUrl(file.url)}
                    className="p-2 hover:bg-green-100 rounded transition-colors"
                    title="Copier l'URL"
                  >
                    {copiedUrl === file.url ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleRemoveFile(file.url)}
                    className="p-2 hover:bg-red-100 rounded transition-colors"
                    title="Retirer de la liste"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Astuce :</strong> Copiez l'URL et ajoutez-la dans votre JSON avec le préfixe approprié :
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
              <li>• Pour une image : <code className="bg-blue-100 px-1 rounded">image: {'{URL}'}</code></li>
              <li>• Pour une vidéo : <code className="bg-blue-100 px-1 rounded">video: {'{URL}'}</code></li>
            </ul>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
        <h4 className="font-semibold mb-2">📖 Comment utiliser :</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Sélectionnez une image ou un PDF</li>
          <li>Cliquez sur "Uploader le fichier"</li>
          <li>Copiez l'URL générée</li>
          <li>Ajoutez-la dans votre contenu JSON avec le bon préfixe</li>
        </ol>
      </div>
    </div>
  );
}
