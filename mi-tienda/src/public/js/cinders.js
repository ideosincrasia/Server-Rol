document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('cinders-container');
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
        const cinder = document.createElement('div');
        cinder.classList.add('cinder');
        
        // Spawn in top-left area (0-30% of viewport)
        const startX = Math.random() * 20;
        const startY = Math.random() * 20;
        cinder.style.left = startX + 'vw';
        cinder.style.top = startY + 'vh';

        // Randomize movement direction (Right and Down)
        cinder.style.setProperty('--move-x', (20 + Math.random() * 70) + 'vw');
        cinder.style.setProperty('--move-y', (20 + Math.random() * 80) + 'vh');
        cinder.style.setProperty('--rotation', (Math.random() * 360 - 180) + 'deg');

        // Randomize appearance and timing
        cinder.style.width = cinder.style.height = (2 + Math.random() * 2) + 'px';
        cinder.style.animationDuration = (5 + Math.random() * 25) + 's';
        cinder.style.animationDelay = (Math.random() * -15) + 's';

        container.appendChild(cinder);
    }
});