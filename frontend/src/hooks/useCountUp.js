import { useState, useEffect } from 'react';

// Easing function for smooth animation
const easeOutQuart = (x) => {
    return 1 - Math.pow(1 - x, 4);
};

export const useCountUp = (end, duration = 2500) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const startValue = 0;
        
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Apply easing function for smooth animation
            const easedProgress = easeOutQuart(progress);
            const currentCount = Math.floor(easedProgress * (end - startValue) + startValue);
            
            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
}; 