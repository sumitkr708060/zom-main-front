import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <div className="page-container py-20 flex flex-col items-center text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-8xl mb-6">🗺️</div>
                <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-gray-700 mb-3">Page not found</h2>
                <p className="text-gray-500 mb-8 max-w-md">Looks like this page wandered too far from the 100km radius. Let's get you back on track!</p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
                    <Link to="/shop" className="btn btn-secondary btn-lg">Browse Products</Link>
                </div>
            </motion.div>
        </div>
    );
}
