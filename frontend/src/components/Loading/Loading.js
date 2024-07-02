import React from 'react';
import { useLoading } from '../../context/LoadingContext';
import './Loading.css';

const Loading = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-text">Loading...</div>
    </div>
  );
};

export default Loading;