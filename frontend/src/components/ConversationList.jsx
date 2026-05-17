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
            key={conversation._id}
            onClick={() => onSelect(conversation._id)}
            className={`w-full text-left p-4 hover:bg-gray-700 transition-colors ${
              selectedId === conversation._id ? 'bg-gray-700' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="font-medium text-sm text-white">
                {conversation.owner_user_id?.username || 
                 conversation.display_name || 
                 'Guest User'}
              </span>
              <span className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)} mt-1`} />
            </div>
            
            <p className="text-xs text-gray-400 truncate mb-2">
              {conversation.last_message || 'No messages'}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {conversation.user_message_count || 0} user • {conversation.lucas_message_count || 0} lucas
                {conversation.file_count > 0 && ` • ${conversation.file_count} 📎`}
              </span>
              <span>
                {new Date(conversation.updated_at).toLocaleDateString()}
              </span>
            </div>

            {conversation.is_guest && (
              <div className="mt-1">
                <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">Guest</span>
              </div>
            )}
          </button>
        ))
      )}
    </div>
  );
}

export default ConversationList;

