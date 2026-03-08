import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectToken } from '../store/authSlice';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

let socketInstance = null;

export const useSocket = (options = {}) => {
    const token = useSelector(selectToken);
    const { onOrderUpdate, onNewOrder, onPaymentSuccess } = options;

    const connect = useCallback(() => {
        if (socketInstance?.connected) return socketInstance;
        socketInstance = io('/', { transports: ['websocket', 'polling'], autoConnect: true });
        return socketInstance;
    }, []);

    useEffect(() => {
        const socket = connect();

        socket.on('connect', () => console.log('🔌 Socket connected'));
        socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

        if (token) socket.emit('join', token);

        if (onOrderUpdate) socket.on('orderUpdate', onOrderUpdate);
        if (onNewOrder) socket.on('newOrder', onNewOrder);
        if (onPaymentSuccess) socket.on('paymentSuccess', onPaymentSuccess);

        // Global notifications
        socket.on('vendorApproval', ({ approved, message }) => {
            if (approved) toast.success(`🎉 ${message}`);
            else toast.error(`❌ ${message}`);
        });

        return () => {
            if (onOrderUpdate) socket.off('orderUpdate', onOrderUpdate);
            if (onNewOrder) socket.off('newOrder', onNewOrder);
            if (onPaymentSuccess) socket.off('paymentSuccess', onPaymentSuccess);
        };
    }, [token, onOrderUpdate, onNewOrder, onPaymentSuccess, connect]);

    const subscribeToOrder = useCallback((orderId) => {
        socketInstance?.emit('subscribeOrder', orderId);
    }, []);

    return { socket: socketInstance, subscribeToOrder };
};
