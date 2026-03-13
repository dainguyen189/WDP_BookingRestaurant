// src/context/SessionContext.js

import React, { createContext, useContext, useState, useEffect } from "react";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedSessionId = localStorage.getItem('sessionId');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedSessionId) {
        setSessionId(storedSessionId);
      }
    } catch (error) {
      console.error("Lỗi khi tải session từ localStorage:", error);
      localStorage.clear();
    }
  }, []);

  const login = (userData, newSessionId) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    localStorage.setItem('sessionId', newSessionId);
    setSessionId(newSessionId);
  };
  
  const startDiningSession = (newSessionId) => {
    localStorage.setItem('sessionId', newSessionId);
    setSessionId(newSessionId);
  };
  
  const saveSession = startDiningSession;

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    localStorage.removeItem('sessionId');
    setSessionId(null);
  };

  const value = { 
    user, 
    sessionId, 
    login, 
    logout, 
    setUser, 
    startDiningSession,
    saveSession 
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);