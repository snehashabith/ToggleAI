import React, { useState } from 'react';
import { motion } from 'framer-motion';

function Sidebar({
  isOpen,
  user,
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onLogout,
  onDeleteAccount,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <motion.div
      animate={{ width: isOpen ? 280 : 0 }}
      transition={{ duration: 0.3 }}
      className="sidebar"
    >
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">✨</div>
            <span className="logo-text">ToggleAI</span>
          </div>
        </div>

        {/* New Chat Button */}
        <button className="new-chat-btn" onClick={onNewChat}>
          <Plus size={20} />
          New Chat
        </button>

        {/* Chat History */}
        <div className="chat-history">
          <h3 className="history-title">Chat History</h3>
          <div className="chats-list">
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div
                  className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquare size={16} className="chat-icon" />
                  <div className="chat-info">
                    <p className="chat-title">{chat.title}</p>
                    <p className="chat-meta">
                      {chat.timestamp?.toDate?.() ? chat.timestamp.toDate().toLocaleDateString() : 'Just now...'}
                    </p>
                  </div>
                  <button
                    className="delete-chat-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="sidebar-divider"></div>

        {/* User Profile Section */}
        {user && (
          <div className="user-section">
            <div className="user-profile">
              <div className="user-avatar">{user.avatar}</div>
              <div className="user-info">
                <p className="user-name">{user.name}</p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sidebar-actions">
              <button className="action-btn settings-btn" title="Settings">
                <Settings size={18} />
                <span>Settings</span>
              </button>

              <button
                className="action-btn logout-btn"
                onClick={onLogout}
                title="Logout"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>

              <button
                className="action-btn delete-btn"
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                title="Delete Account"
              >
                <Trash size={18} />
                <span>Delete Account</span>
              </button>

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="delete-confirmation"
                >
                  <p>This action cannot be undone.</p>
                  <div className="confirm-buttons">
                    <button
                      className="confirm-delete"
                      onClick={onDeleteAccount}
                    >
                      Delete
                    </button>
                    <button
                      className="confirm-cancel"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Sidebar;
