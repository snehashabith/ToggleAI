import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import PromptPage from './components/PromptPage';
import Login from './Login';

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]); // Start empty, let Firestore populate this
  const [savings, setSavings] = useState({
    tokensUsed: 0, costSaved: 0, queriesProcessed: 0, timeFreed: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // AUTH & SAVINGS INITIALIZATION
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email,
          email: fbUser.email,
          avatar: fbUser.photoURL ? <img src={fbUser.photoURL} alt="avatar" /> : '👤',
        });

        // Ensure savings record exists
        const savingsRef = doc(db, 'savings', fbUser.uid);
        const savingsSnap = await getDoc(savingsRef);
        if (!savingsSnap.exists()) {
          await setDoc(savingsRef, {
            tokensUsed: 0, costSaved: 0, queriesProcessed: 0, timeFreed: 0, createdAt: serverTimestamp(),
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // LISTENER: Global Savings Stats
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'savings', user.id), (snap) => {
      if (snap.exists()) setSavings(snap.data());
    });
    return () => unsub();
  }, [user]);

  // LISTENER: User's Chat List (Sidebar)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.id, 'chats'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // LISTENER: Active Chat Messages
  useEffect(() => {
    if (!user || !activeChat) {
      setChatMessages([]);
      return;
    }
    const msgsRef = collection(db, 'users', user.id, 'chats', String(activeChat), 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, activeChat]);

  // HANDLERS
  const handleSendMessage = async (text) => {
    if (!user || !text.trim()) return;

    let currentChatId = activeChat;

    // 1. Create chat if it doesn't exist
    if (!currentChatId) {
      const newChatRef = doc(collection(db, 'users', user.id, 'chats'));
      currentChatId = newChatRef.id;
      await setDoc(newChatRef, {
        title: text.substring(0, 30),
        timestamp: new Date(),
        model: 'GPT-4o-mini',
        summary: 'New conversation starting...'
      });
      setActiveChat(currentChatId);
    }

    // 2. Add User Message
    const msgsRef = collection(db, 'users', user.id, 'chats', currentChatId, 'messages');
    await addDoc(msgsRef, {
      text,
      sender: 'user',
      timestamp: new Date(),
    });

    // 3. Notify backend – receive reply text in response so we can display it immediately
    try {
      const resp = await fetch(
        process.env.REACT_APP_ANALYZE_ENDPOINT ||
          'https://us-central1-YO.cloudfunctions.net/analyzePrompt',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            chatId: currentChatId,
            prompt: text,
          }),
        }
      );
      const data = await resp.json();
      if (data.reply) {
        // optimistic display; Firestore listener will eventually sync with the same message
        setChatMessages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            text: data.reply,
            sender: 'assistant',
            model: data.model,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error('backend error', err);
    }

    // 4. (optional) Person A's backend will listen to this collection and add the 'assistant' reply
  };

  const handleLogout = () => signOut(auth);

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete everything? This cannot be undone.')) return;
    const currentUser = auth.currentUser;
    try {
      await deleteDoc(doc(db, 'savings', currentUser.uid));
      await deleteDoc(doc(db, 'users', currentUser.uid));
      await deleteUser(currentUser);
      setUser(null);
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') alert("Please re-login to delete.");
    }
  };

  if (!user) return <Login />;

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        user={user}
        chats={chats}
        activeChat={activeChat}
        onNewChat={() => setActiveChat(null)}
        onSelectChat={setActiveChat}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <PromptPage
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          savings={savings}
          activeChat={activeChat}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}

export default App;