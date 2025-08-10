import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api';

type ColumnAnalysis = {
  column: string;
  dtype: string;
  nulls: number;
  unique: number;
  sample_values: string[];
};

type User = {
    email: string;
    is_active: boolean;
    messages_used: number;
    reports_used: number;
};

type AppContextType = {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  fileId: string | null;
  setFileId: React.Dispatch<React.SetStateAction<string | null>>;
  sessionId: string | null;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  columns: ColumnAnalysis[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnAnalysis[]>>;
  preview: any[];
  setPreview: React.Dispatch<React.SetStateAction<any[]>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  resetState: () => void;
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  userFiles: any[];
  setUserFiles: React.Dispatch<React.SetStateAction<any[]>>;
  isAuthCheckComplete: boolean;
};

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null); // Эта строка сохранена
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const [columns, setColumns] = useState<ColumnAnalysis[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const [userFiles, setUserFiles] = useState<any[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
    setIsAuthCheckComplete(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.error("Не удалось получить данные пользователя. Токен может быть недействителен.", error);
          logout();
        }
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
  };

  const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        setFileId(null);
        setSessionId(null); // Эта строка сохранена
        setColumns([]);
        setPreview([]);
    };

  // Функция сброса состояния при выборе нового файла
  const resetState = () => {
    setFile(null);
    setFileId(null);
    setSessionId(null); // Эта строка сохранена
    setColumns([]);
    setPreview([]);
    setError(null);
  };

  const value = {
    file, setFile,
    fileId, setFileId,
    sessionId, setSessionId, // Эта строка сохранена
    columns, setColumns,
    preview, setPreview,
    error, setError,
    isLoading, setIsLoading,
    resetState,
    token,
    user,
    login,
    logout,
    isAuthCheckComplete,
    userFiles,
    setUserFiles
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};