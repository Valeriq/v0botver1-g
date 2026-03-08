import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '../ui/button';

interface CSVUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export function CSVUpload({ onUpload }: CSVUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv"
        onChange={handleFileChange}
        className="hidden"
      />
      {fileName ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
          <span className="text-sm">{fileName}</span>
          <Button variant="ghost" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Загрузка...' : 'Загрузить CSV'}
        </Button>
      )}
    </div>
  );
}
