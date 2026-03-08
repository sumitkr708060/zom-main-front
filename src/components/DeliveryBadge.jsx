export default function DeliveryBadge({ info, size = 'sm' }) {
    if (!info) return null;
    const colorMap = {
        green: 'bg-green-100 text-green-700 border-green-200',
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        orange: 'bg-orange-100 text-orange-700 border-orange-200',
        gray: 'bg-gray-100 text-gray-600 border-gray-200',
        red: 'bg-red-100 text-red-600 border-red-200',
    };
    const sizeMap = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' };
    const classes = `inline-flex items-center rounded-full border font-medium ${colorMap[info.color] || colorMap.gray} ${sizeMap[size]}`;

    return <span className={classes}>{info.etaLabel || info.eta}</span>;
}
