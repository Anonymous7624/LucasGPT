import React, { useEffect, useState } from 'react';
import api from '../api';

function MessageBubble({ message }) {
  const isLucas = message.sender === 'lucas';
  const files = message.file_ids || [];

  const ImageFile = ({ file }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      let objectUrl = null;
      
      const loadImage = async () => {
        try {
          const blob = await api.fetchFileBlob(file._id, 'view');
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          setLoading(false);
        } catch (err) {
          console.error('Error loading image:', err);
          setError(true);
          setLoading(false);
        }
      };

      loadImage();

      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [file._id]);

    if (loading) {
      return <div className="text-xs opacity-70 mt-2">Loading image...</div>;
    }

    if (error) {
      return <div className="text-xs opacity-70 mt-2 text-red-400">Failed to load image</div>;
    }

    return (
      <div className="mt-2">
        <img
          src={imageUrl}
          alt={file.original_name}
          className="max-w-full rounded border border-gray-600 cursor-pointer"
          onClick={async () => {
            try {
              const blob = await api.fetchFileBlob(file._id, 'view');
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            } catch (err) {
              console.error('Error opening image:', err);
            }
          }}
        />
        <p className="text-xs opacity-70 mt-1">{file.original_name}</p>
      </div>
    );
  };

  const PDFFile = ({ file }) => {
    const handleView = async () => {
      try {
        const blob = await api.fetchFileBlob(file._id, 'view');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (err) {
        console.error('Error viewing PDF:', err);
        alert('Failed to open PDF');
      }
    };

    const handleDownload = async () => {
      try {
        const blob = await api.fetchFileBlob(file._id, 'download');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading PDF:', err);
        alert('Failed to download PDF');
      }
    };

    return (
      <div className="mt-2 p-3 bg-gray-700 rounded border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-sm font-medium">{file.original_name}</p>
              <p className="text-xs opacity-70">{(file.size_bytes / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleView}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              Open
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFile = (file) => {
    const isImage = file.mime_type?.startsWith('image/');
    const isPDF = file.mime_type === 'application/pdf';

    if (isImage) {
      return <ImageFile key={file._id} file={file} />;
    }

    if (isPDF) {
      return <PDFFile key={file._id} file={file} />;
    }

    return null;
  };

  return (
    <div className={`flex ${isLucas ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isLucas
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-100'
        }`}
      >
        <div className="text-xs opacity-70 mb-1">
          {isLucas ? 'Lucas' : 'You'}
        </div>
        
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map(file => renderFile(file))}
          </div>
        )}
        
        <div className="text-xs opacity-50 mt-1">
          {new Date(message.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;

