import React, { useMemo, useState } from 'react';

interface ImportAccountsModalProps {
  readonly onClose: () => void;
  readonly onImported: (summary: { success: number; totalProcessed: number }) => void;
}

const ImportAccountsModal: React.FC<ImportAccountsModalProps> = ({ onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const fileHint = useMemo<string>(
    () => 'Upload a JSON array file or a CSV with headers: name,token[,status] (max 5MB).',
    []
  );

  const handleClose = (): void => {
    if (isSubmitting) return;
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    setHasError(false);
    setErrorMessage('');
    const selected = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(selected);
    setPreviewCount(null);
    if (!selected) return;
    try {
      const text = await selected.text();
      if (selected.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        setPreviewCount(Array.isArray(parsed) ? parsed.length : 0);
        return;
      }
      if (selected.name.toLowerCase().endsWith('.csv')) {
        const lines = text.trim().split('\n');
        setPreviewCount(Math.max(lines.length - 1, 0));
        return;
      }
      setPreviewCount(null);
    } catch (err) {
      setHasError(true);
      setErrorMessage('Could not parse file. Ensure it is valid JSON or CSV.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setHasError(false);
    setErrorMessage('');
    if (!file) {
      setHasError(true);
      setErrorMessage('Please select a file to import.');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/front-api/accounts/import', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Import failed');
      const data = await response.json();
      onImported({ success: data.success ?? 0, totalProcessed: data.totalProcessed ?? 0 });
      onClose();
    } catch (err) {
      setHasError(true);
      setErrorMessage('Failed to import accounts. Please check the file and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="import-accounts-title">
      <div className="fixed inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl ring-1 ring-gray-200">
        <div className="mb-4 flex items-start justify-between">
          <h2 id="import-accounts-title" className="text-lg font-semibold">Import Accounts</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            aria-label="Close import accounts dialog"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">File</label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,application/json,.json,text/csv"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
              aria-describedby="file-hint"
            />
            <p id="file-hint" className="mt-2 text-xs text-gray-500">{fileHint}</p>
          </div>

          {file ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-medium">{file.name}</span>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              {previewCount !== null ? (
                <p className="mt-2 text-xs text-gray-600">Detected {previewCount} record{previewCount === 1 ? '' : 's'}.</p>
              ) : null}
            </div>
          ) : null}

          {hasError ? (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          ) : null}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              {isSubmitting ? 'Importing…' : 'Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportAccountsModal;



