import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Clock, DollarSign } from 'lucide-react';

function SavingsDashboard({ savings }) {
  const dashboardItems = [
    {
      icon: <DollarSign size={20} />,
      label: 'Cost Saved',
      value: `$${savings.costSaved.toFixed(2)}`,
      color: 'green',
    },
    {
      icon: <Zap size={20} />,
      label: 'Tokens Used',
      value: savings.tokensUsed.toLocaleString(),
      color: 'blue',
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Queries',
      value: savings.queriesProcessed,
      color: 'purple',
    },
    {
      icon: <Clock size={20} />,
      label: 'Time Freed',
      value: `${savings.timeFreed}h`,
      color: 'orange',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="savings-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {dashboardItems.map((item, index) => (
        <motion.div
          key={index}
          className={`dashboard-item ${item.color}`}
          variants={itemVariants}
        >
          <div className="item-icon">{item.icon}</div>
          <div className="item-content">
            <p className="item-label">{item.label}</p>
            <p className="item-value">{item.value}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default SavingsDashboard;
