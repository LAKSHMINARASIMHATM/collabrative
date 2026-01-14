// CodeSync IDE Demo Project - JavaScript

console.log('🚀 CodeSync IDE Demo Loaded!');

// Demo button functionality
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('demoButton');
    const output = document.getElementById('output');
    let clickCount = 0;

    if (button && output) {
        button.addEventListener('click', handleButtonClick);
    }

    function handleButtonClick() {
        clickCount++;

        const messages = [
            '🎉 Welcome to CodeSync IDE!',
            '💻 You can edit this file in real-time',
            '🔥 Try the debugging features',
            '⚡ Experience live collaboration',
            '🚀 Run code in multiple languages',
            '✨ All changes auto-save!'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        output.innerHTML = `
            <div style="animation: fadeIn 0.5s ease-out;">
                <strong>Click #${clickCount}</strong>
                <p>${randomMessage}</p>
                <small>Timestamp: ${new Date().toLocaleTimeString()}</small>
            </div>
        `;

        // Add celebration animation
        celebrateClick();
    }

    function celebrateClick() {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);

        // Create particle effect
        createParticles();
    }

    function createParticles() {
        const container = document.querySelector('.interactive-demo');

        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.borderRadius = '50%';
            particle.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = '50%';
            particle.style.pointerEvents = 'none';

            container.appendChild(particle);

            // Animate particle
            particle.animate([
                { transform: 'translateY(0) scale(1)', opacity: 1 },
                { transform: `translateY(-${50 + Math.random() * 50}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
            }).onfinish = () => particle.remove();
        }
    }
});

// Example async function
async function fetchData() {
    try {
        const response = await fetch('https://api.github.com/repos/microsoft/vscode');
        const data = await response.json();
        console.log('Repository data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Example class
class CodeProject {
    constructor(name, language) {
        this.name = name;
        this.language = language;
        this.files = [];
    }

    addFile(filename) {
        this.files.push(filename);
        console.log(`Added ${filename} to ${this.name}`);
    }

    getInfo() {
        return {
            project: this.name,
            language: this.language,
            fileCount: this.files.length
        };
    }
}

// Example usage
const myProject = new CodeProject('Demo App', 'JavaScript');
myProject.addFile('index.html');
myProject.addFile('styles.css');
myProject.addFile('app.js');

console.log('Project Info:', myProject.getInfo());

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CodeProject, fetchData };
}
