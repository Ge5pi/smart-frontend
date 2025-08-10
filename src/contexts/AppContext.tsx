// src/contexts/AppContext.tsx

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api, { getMe, type User } from '../api'; // Убедитесь, что тип User импортируется

// --- Определяем полный тип для нашего контекста ---
type AppContextType = {
  // Состояния, связанные с файлом
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  columns: ColumnAnalysis[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnAnalysis[]>>;
  preview: any[];
  setPreview: React.Dispatch<React.SetStateAction<any[]>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resetFileState: () => void; // Переименовано для ясности

  // Состояния, связанные с сессией и списком файлов
  fileId: string | null;
  setFileId: React.Dispatch<React.SetStateAction<string | null>>;
  sessionId: string | null;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  userFiles: any[];
  setUserFiles: React.Dispatch<React.SetStateAction<any[]>>;

  // Состояния аутентификации
  token: string | null;
  currentUser: User | null;
  isAuthCheckComplete: boolean;
  login: (token: string) => void;
  logout: () => void;
};

// Тип для анализа колонок (из вашего старого файла)
type ColumnAnalysis = {
  column: string;
  dtype: string;
  nulls: number;
  unique: number;
  sample_values: string[];
};


export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // --- Все состояния из вашего оригинального файла ---
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<ColumnAnalysis[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<any[]>([]);

  // --- Состояния для аутентификации ---
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  // --- Функции ---

  // Функция для сброса состояния, связанного только с файлом
  const resetFileState = () => {
    setFile(null);
    setColumns([]);
    setPreview([]);
    setError(null);
    setFileId(null); // Также сбрасываем fileId и sessionId
    setSessionId(null);
  };

  const login = useCallback((newToken: string) => {
    localStorage.setItem('authToken', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setCurrentUser(null);
    // При выходе из системы сбрасываем и состояние файла
    resetFileState();
    setUserFiles([]);
  }, []);

  // Эффект для проверки токена и загрузки данных пользователя
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const response = await getMe();
          setCurrentUser(response.data);
        } catch (error) {
          console.error("Ошибка аутентификации, токен недействителен:", error);
          logout();
        }
      }
      setIsAuthCheckComplete(true);
    };

    checkAuthStatus();
  }, [token, logout]);


  const value: AppContextType = {
    file, setFile,
    columns, setColumns,
    preview, setPreview,
    error, setError,
    isLoading, setIsLoading,
    resetFileState,
    fileId, setFileId,
    sessionId, setSessionId,
    userFiles, setUserFiles,
    token,
    currentUser,
    isAuthCheckComplete,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};