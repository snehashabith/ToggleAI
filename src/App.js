import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import PromptPage from './components/PromptPage';
import Login from './Login';

// Firebase authentication
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([
    {
      id: 1,
      title: 'How to optimize React apps',
      timestamp: new Date(Date.now() - 86400000),
      model: 'GPT-4',
    },
    {
      id: 2,
      title: 'Machine Learning basics',
      timestamp: new Date(Date.now() - 172800000),
      model: 'Claude',
    },
    {
      id: 3,
      title: 'Web design trends 2024',
      timestamp: new Date(Date.now() - 259200000),
      model: 'GPT-4',
    },
  ]);
  const [savings, setSavings] = useState({
    tokensUsed: 15420,
    costSaved: 42.50,
    queriesProcessed: 234,
    timeFreed: 8.5,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    // listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email,
          email: fbUser.email,
          avatar: fbUser.photoURL ? <img src={fbUser.photoURL} alt="avatar" /> : '👤',
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNewChat = () => {
    setActiveChat(null);
  };

  const handleSelectChat = (chatId) => {
    setActiveChat(chatId);
  };

  const handleAddChat = (title, model) => {
    const newChat = {
      id: chats.length + 1,
      title,
      timestamp: new Date(),
      model,
    };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
  };

  const handleDeleteChat = (chatId) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
      alert('Logout failed');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      alert('Account deleted');
      // Implement delete account logic
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        user={user}
        chats={chats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <PromptPage
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          savings={savings}
          activeChat={activeChat}
          onAddChat={handleAddChat}
        />
      </main>
    </div>
  );
}

export default App;
