import React from 'react';

function MessageBubble({ message }) {
  const isLucas = message.sender === 'lucas';

  return (
    <div className={`flex ${isLucas ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isLucas
            ? 'bg-blue-600 text-white'
            : 'bg-chat-input text-gray-100'
        }`}
      >
        <div className="text-xs opacity-70 mb-1">
          {isLucas ? 'Lucas' : 'You'}
        </div>
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className="text-xs opacity-50 mt-1">
          {new Date(message.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
