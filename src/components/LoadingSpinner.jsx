export default function LoadingSpinner({ fullscreen, size = 'md' }) {
    const sizes = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3', xl: 'w-16 h-16 border-4' };
    const spinner = (
        <div className={`${sizes[size]} rounded-full border-primary/30 border-t-primary animate-spin`} />
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
                <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mb-4 animate-pulse-slow">
                    <span className="text-white font-black text-xl">Z</span>
                </div>
                {spinner}
                <p className="mt-4 text-gray-500 text-sm font-medium">Loading Zomitron...</p>
            </div>
        );
    }
    return <div className="flex justify-center py-8">{spinner}</div>;
}
