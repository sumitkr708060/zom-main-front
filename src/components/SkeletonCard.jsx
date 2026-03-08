export default function SkeletonCard() {
    return (
        <div className="card overflow-hidden">
            <div className="skeleton aspect-square w-full" />
            <div className="p-3 space-y-2">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-8 w-full rounded-xl mt-2" />
            </div>
        </div>
    );
}

export function SkeletonGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
    );
}
