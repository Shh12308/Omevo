import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ textAlign: 'center', padding: '60px' }}
    >
      <h1>404</h1>
      <h2>Page Not Found</h2>

      <Link to="/">Go Home</Link>
    </motion.div>
  );
};

export default NotFound;
