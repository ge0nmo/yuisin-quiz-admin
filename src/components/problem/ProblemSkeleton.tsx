export default function ProblemSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
                <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                <div className="flex gap-2">
                    <div className="h-9 w-9 bg-gray-200 rounded-lg"></div>
                    <div className="h-9 w-9 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
            <div className="space-y-4 mb-6">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-40 bg-gray-100 rounded-xl w-full"></div>
            </div>
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
                ))}
            </div>
        </div>
    );
}
