export default function ExamSkeleton() {
    return (
        <div className="animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center border-b border-gray-100 p-5">
                    <div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div>
                    <div className="h-6 w-48 bg-gray-200 rounded mx-5 flex-1"></div>
                    <div className="h-9 w-24 bg-gray-200 rounded mx-auto"></div>
                </div>
            ))}
        </div>
    );
}
