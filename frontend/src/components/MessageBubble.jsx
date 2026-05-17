import React from 'react';
import api from '../api';

function MessageBubble({ message }) {
  const isLucas = message.sender === 'lucas';
  const files = message.file_ids || [];

  const renderFile = (file) => {
    const isImage = file.mime_type?.startsWith('image/');
    const isPDF = file.mime_type === 'application/pdf';

    if (isImage) {
      return (
        <div key={file._id} className="mt-2">
          <img
            src={api.getFileViewUrl(file._id)}
            alt={file.original_name}
            className="max-w-full rounded border border-gray-600 cursor-pointer"
            onClick={() => window.open(api.getFileViewUrl(file._id), '_blank')}
          />
          <p className="text-xs opacity-70 mt-1">{file.original_name}</p>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div key={file._id} className="mt-2 p-3 bg-gray-700 rounded border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm font-medium">{file.original_name}</p>
                <p className="text-xs opacity-70">{(file.size_bytes / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={api.getFileViewUrl(file._id)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                View
              </a>
              <a
                href={api.getFileDownloadUrl(file._id)}
                download
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      );
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

