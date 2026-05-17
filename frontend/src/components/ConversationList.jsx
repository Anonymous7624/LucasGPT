import React from 'react';

function ConversationList({ conversations, selectedId, onSelect }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500';
      case 'answered':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="divide-y divide-gray-700">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No conversations yet
        </div>
      ) : (
        conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`w-full text-left p-4 hover:bg-chat-input transition-colors ${
              selectedId === conversation.id ? 'bg-chat-input' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="font-medium text-sm">
                {conversation.display_name || 'Anonymous'}
              </span>
              <span className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)} mt-1`} />
            </div>
            
            <p className="text-xs text-gray-400 truncate mb-2">
              {conversation.last_message || 'No messages'}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {conversation.user_message_count} msg{conversation.user_message_count !== 1 ? 's' : ''}
              </span>
              <span>
                {new Date(conversation.updated_at).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export default ConversationList;
