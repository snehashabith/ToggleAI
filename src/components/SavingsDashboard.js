import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Clock, DollarSign } from 'lucide-react';
import PromptPage from './PromptPage';

function SavingsDashboard({ savings }) {
  // Defensive check: if savings is null/undefined, show a placeholder or return null
  if (!savings) return <div className="loading">Updating metrics...</div>;

  const dashboardItems = [
    {
      icon: <DollarSign size={20} />,
      label: 'Cost Saved',
      // Convert string back to number just in case
      value: `$${Number(savings.costSaved || 0).toFixed(2)}`,
      color: 'green',
    },
    {
      icon: <Zap size={20} />,
      label: 'Tokens Used',
      value: (savings.tokensUsed || 0).toLocaleString(),
      color: 'blue',
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Queries',
      value: savings.queriesProcessed || 0,
      color: 'purple',
    },
    {
      icon: <Clock size={20} />,
      label: 'Time Freed',
      // Note: your backend sent 'timeSavedSeconds', make sure this matches
      value: `${savings.timeSavedSeconds || 0}s`, 
      color: 'orange',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className="savings-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}
    >
      {dashboardItems.map((item, index) => (
        <motion.div
          key={index}
          className={`dashboard-item ${item.color}`}
          variants={itemVariants}
          style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #eee' }} // Add your CSS classes here
        >
          <div className="item-icon" style={{ marginBottom: '0.5rem' }}>{item.icon}</div>
          <div className="item-content">
            <p className="item-label" style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{item.label}</p>
            <p className="item-value" style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{item.value}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default SavingsDashboard;