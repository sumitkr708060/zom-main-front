import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
                        success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
                    }}
                />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);
