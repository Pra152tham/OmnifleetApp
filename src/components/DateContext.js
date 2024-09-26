import React, { createContext, useContext, useState, useEffect } from 'react';

const DateContext = createContext();

export const DateProvider = ({ children }) => {
  const [startDate, setStartDate] = useState(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; 
    setStartDate(today);
  }, []);

  return (
    <DateContext.Provider value={{ startDate, setStartDate }}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = () => useContext(DateContext);
