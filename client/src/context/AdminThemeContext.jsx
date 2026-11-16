import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/api';

const AdminThemeContext = createContext();

export const useAdminTheme = () => {
    const context = useContext(AdminThemeContext);
    if (!context) {
        return {
            theme: 'light',
            toggleTheme: () => {},
            setTheme: () => {},
            isDark: false
        };
    }
    return context;
};

export const AdminThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem('admin_theme') || 'light';
    });

    useEffect(() => {
        // Load theme from backend settings on initial mount
        const fetchInitialTheme = async () => {
            try {
                const { data } = await settingsService.getSettings();
                if (data && data.themeMode) {
                    setThemeState(data.themeMode);
                    localStorage.setItem('admin_theme', data.themeMode);
                }
            } catch (err) {
                console.error("Failed to load theme setting from server", err);
            }
        };

        fetchInitialTheme();
    }, []);

    useEffect(() => {
        // Apply class to body/html
        if (theme === 'dark') {
            document.documentElement.classList.add('admin-dark-mode');
        } else {
            document.documentElement.classList.remove('admin-dark-mode');
        }
        localStorage.setItem('admin_theme', theme);
    }, [theme]);

    const setTheme = async (newTheme, syncWithBackend = true) => {
        setThemeState(newTheme);
        localStorage.setItem('admin_theme', newTheme);

        if (syncWithBackend) {
            try {
                await settingsService.updateSettings({ themeMode: newTheme });
            } catch (err) {
                console.error("Failed to sync theme with backend", err);
            }
        }
    };

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next, true);
    };

    return (
        <AdminThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
            {children}
        </AdminThemeContext.Provider>
    );
};

export default AdminThemeContext;
