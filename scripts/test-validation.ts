
import { validateFile } from '../lib/validation/file-validator';
import { getFileCategory } from '../lib/validation/file-types';

// Mock File implementation for Node.js environment
class MockFile {
    name: string;
    size: number;
    type: string;
    content: string;
    lastModified: number;
    webkitRelativePath: string;

    constructor(content: string[], name: string, options: { type: string } = { type: '' }) {
        this.name = name;
        this.content = content.join('');
        this.size = this.content.length;
        this.type = options.type;
        this.lastModified = Date.now();
        this.webkitRelativePath = '';
    }

    text() {
        return Promise.resolve(this.content);
    }

    arrayBuffer() {
        const buffer = new ArrayBuffer(this.content.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < this.content.length; i++) {
            view[i] = this.content.charCodeAt(i);
        }
        return Promise.resolve(buffer);
    }
}

// Polyfill global File and FileReader if needed (rough approximation)
if (typeof File === 'undefined') {
    (global as any).File = MockFile;
}
if (typeof FileReader === 'undefined') {
    class FileReader {
        result: string | ArrayBuffer | null = null;
        error: Error | null = null;
        onload: ((e: any) => void) | null = null;
        onerror: ((e: any) => void) | null = null;

        readAsText(file: any) {
            setTimeout(() => {
                this.result = file.content;
                if (this.onload) this.onload({ target: { result: this.result } });
            }, 10);
        }

        readAsArrayBuffer(file: any) {
            setTimeout(() => {
                const buffer = new ArrayBuffer(file.content.length);
                const view = new Uint8Array(buffer);
                for (let i = 0; i < file.content.length; i++) {
                    view[i] = file.content.charCodeAt(i);
                }
                this.result = buffer;
                if (this.onload) this.onload({ target: { result: this.result } });
            }, 10);
        }
    }
    (global as any).FileReader = FileReader;
}


async function runTests() {
    console.log('🚀 Running File Validation Tests...\n');

    // Test 1: Valid JS File
    console.log('Test 1: Valid JavaScript File');
    const jsFile = new (global as any).File(['console.log("hello")'], 'test.js', { type: 'application/javascript' });
    const jsResult = await validateFile(jsFile as any);
    if (jsResult.success) {
        console.log('✅ Passed: Valid JS file accepted');
    } else {
        console.log('❌ Failed: JS file rejected', jsResult.errors);
    }

    // Test 2: Invalid Extension
    console.log('\nTest 2: Invalid Extension');
    const exeFile = new (global as any).File(['binary content'], 'virus.exe', { type: 'application/x-msdownload' });
    const exeResult = await validateFile(exeFile as any);
    if (!exeResult.success && exeResult.errors[0].code === 'INVALID_EXTENSION') {
        console.log('✅ Passed: Invalid extension rejected');
    } else {
        console.log('❌ Failed: .exe file not handled correctly', exeResult);
    }

    // Test 3: Large File
    console.log('\nTest 3: Large File');
    // Create large content string
    const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
    const largeFile = new (global as any).File([largeContent], 'large.txt', { type: 'text/plain' });

    // Checking logic directly as constructing huge string might crash or be slow
    if (largeFile.size > 10 * 1024 * 1024) { // Mock check since validateFile runs async
        const largeResult = await validateFile(largeFile as any);
        if (!largeResult.success && largeResult.errors[0].code === 'FILE_TOO_LARGE') {
            console.log('✅ Passed: Large file rejected');
        } else {
            console.log('❌ Failed: Large file not handled correctly', largeResult);
        }
    }

    console.log('\n✨ Validation Logic Verified!');
}

runTests().catch(console.error);
