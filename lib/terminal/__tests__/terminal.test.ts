/**
 * Terminal Command Tests
 * Comprehensive test suite for terminal commands
 */

import { CommandParser } from '../command-parser'
import { CommandValidator } from '../command-validator'
import { TerminalExecutor } from '../terminal-executor'
import { windowsCommands } from '../windows-commands'

describe('Terminal System Tests', () => {
    describe('Command Parser', () => {
        let parser: CommandParser

        beforeEach(() => {
            parser = new CommandParser()
        })

        test('should parse simple command', () => {
            const result = parser.parse('ls')
            expect(result.command).toBe('ls')
            expect(result.args).toEqual([])
            expect(result.flags.size).toBe(0)
        })

        test('should parse command with arguments', () => {
            const result = parser.parse('cat file.txt')
            expect(result.command).toBe('cat')
            expect(result.args).toEqual(['file.txt'])
        })

        test('should parse command with flags', () => {
            const result = parser.parse('ls -l --all')
            expect(result.command).toBe('ls')
            expect(result.flags.get('l')).toBe(true)
            expect(result.flags.get('all')).toBe(true)
        })

        test('should parse quoted arguments', () => {
            const result = parser.parse('echo "hello world"')
            expect(result.command).toBe('echo')
            expect(result.args).toEqual(['hello world'])
        })

        test('should parse piped commands', () => {
            const result = parser.parse('ls | grep test')
            expect(result.command).toBe('ls')
            expect(result.pipes.length).toBe(1)
            expect(result.pipes[0].command).toBe('grep')
        })

        test('should parse redirects', () => {
            const result = parser.parse('ls > output.txt')
            expect(result.command).toBe('ls')
            expect(result.redirects.stdout).toBe('output.txt')
        })

        test('should handle empty input', () => {
            const result = parser.parse('')
            expect(result.command).toBe('')
        })
    })

    describe('Command Validator', () => {
        let validator: CommandValidator

        beforeEach(() => {
            validator = new CommandValidator()
        })

        test('should allow valid commands', () => {
            const parser = new CommandParser()
            const parsed = parser.parse('ls')
            const result = validator.validate(parsed)
            expect(result.valid).toBe(true)
            expect(result.errors.length).toBe(0)
        })

        test('should block invalid commands', () => {
            const parser = new CommandParser()
            const parsed = parser.parse('invalidcommand')
            const result = validator.validate(parsed)
            expect(result.valid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        test('should block dangerous commands', () => {
            const parser = new CommandParser()
            const parsed = parser.parse('rm -rf /')
            const result = validator.validate(parsed)
            expect(result.valid).toBe(false)
        })

        test('should detect path traversal', () => {
            const parser = new CommandParser()
            const parsed = parser.parse('cat ../../../etc/passwd')
            const result = validator.validate(parsed)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        test('should sanitize input', () => {
            const parser = new CommandParser()
            const parsed = parser.parse('echo test\x00null')
            const result = validator.validate(parsed)
            expect(result.sanitized?.rawInput).not.toContain('\x00')
        })

        test('should check security threats', () => {
            const parser = new CommandParser()
            const parsed = parser.parse('rm -rf folder')
            const security = validator.checkSecurity(parsed)
            expect(security.safe).toBe(false)
            expect(security.threats.length).toBeGreaterThan(0)
        })
    })

    describe('Terminal Executor', () => {
        let executor: TerminalExecutor
        let mockTerminal: any

        beforeEach(() => {
            mockTerminal = {
                write: jest.fn(),
                writeln: jest.fn(),
            }

            const context = {
                workingDirectory: '/workspace',
                environment: new Map([['USER', 'test']]),
                user: 'test',
                terminal: mockTerminal,
            }

            executor = new TerminalExecutor(context)
        })

        test('should register and execute command', async () => {
            executor.registerCommand('test', async () => ({
                success: true,
                output: 'test output',
                exitCode: 0,
                executionTime: 0,
            }))

            const parser = new CommandParser()
            const validator = new CommandValidator()
            validator.allowCommand('test')

            const parsed = parser.parse('test')
            const validation = validator.validate(parsed)
            const result = await executor.execute(parsed, validation)

            expect(result.success).toBe(true)
            expect(result.output).toBe('test output')
        })

        test('should handle command timeout', async () => {
            executor.registerCommand('slow', async () => {
                await new Promise(resolve => setTimeout(resolve, 5000))
                return { success: true, output: '', exitCode: 0, executionTime: 0 }
            })

            const parser = new CommandParser()
            const validator = new CommandValidator()
            validator.allowCommand('slow')

            const parsed = parser.parse('slow')
            const validation = validator.validate(parsed)
            const result = await executor.executeWithTimeout(parsed, validation, 100)

            expect(result.success).toBe(false)
            expect(result.exitCode).toBe(124)
        })

        test('should handle command errors', async () => {
            executor.registerCommand('error', async () => {
                throw new Error('Test error')
            })

            const parser = new CommandParser()
            const validator = new CommandValidator()
            validator.allowCommand('error')

            const parsed = parser.parse('error')
            const validation = validator.validate(parsed)
            const result = await executor.execute(parsed, validation)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Test error')
        })

        test('should update context', () => {
            executor.setWorkingDirectory('/new/path')
            expect(executor.getWorkingDirectory()).toBe('/new/path')

            executor.setEnv('TEST', 'value')
            expect(executor.getEnv('TEST')).toBe('value')
        })
    })

    describe('Windows Commands', () => {
        let mockTerminal: any
        let context: any

        beforeEach(() => {
            mockTerminal = {
                write: jest.fn(),
                writeln: jest.fn(),
            }

            context = {
                workingDirectory: '/workspace',
                environment: new Map(),
                user: 'test',
                terminal: mockTerminal,
            }
        })

        test('ls command should execute', async () => {
            const result = await windowsCommands.ls({ command: 'ls', args: [], flags: new Map(), rawInput: 'ls', pipes: [], redirects: {} }, context)
            expect(result.success).toBe(true)
            expect(mockTerminal.writeln).toHaveBeenCalled()
        })

        test('pwd command should return working directory', async () => {
            const result = await windowsCommands.pwd({ command: 'pwd', args: [], flags: new Map(), rawInput: 'pwd', pipes: [], redirects: {} }, context)
            expect(result.success).toBe(true)
            expect(result.output).toBe('/workspace')
        })

        test('echo command should print text', async () => {
            const result = await windowsCommands.echo({ command: 'echo', args: ['hello', 'world'], flags: new Map(), rawInput: 'echo hello world', pipes: [], redirects: {} }, context)
            expect(result.success).toBe(true)
            expect(mockTerminal.writeln).toHaveBeenCalledWith('hello world')
        })

        test('cat command should require filename', async () => {
            const result = await windowsCommands.cat({ command: 'cat', args: [], flags: new Map(), rawInput: 'cat', pipes: [], redirects: {} }, context)
            expect(result.success).toBe(false)
            expect(result.error).toBe('No filename specified')
        })

        test('mkdir command should require directory name', async () => {
            const result = await windowsCommands.mkdir({ command: 'mkdir', args: [], flags: new Map(), rawInput: 'mkdir', pipes: [], redirects: {} }, context)
            expect(result.success).toBe(false)
        })
    })

    describe('Integration Tests', () => {
        test('full command flow should work', async () => {
            const parser = new CommandParser()
            const validator = new CommandValidator()
            const mockTerminal = {
                write: jest.fn(),
                writeln: jest.fn(),
            }

            const context = {
                workingDirectory: '/workspace',
                environment: new Map(),
                user: 'test',
                terminal: mockTerminal,
            }

            const executor = new TerminalExecutor(context)
            Object.entries(windowsCommands).forEach(([cmd, handler]) => {
                executor.registerCommand(cmd, handler)
            })

            // Test valid command
            const parsed = parser.parse('echo test')
            const validation = validator.validate(parsed)
            expect(validation.valid).toBe(true)

            const result = await executor.execute(parsed, validation)
            expect(result.success).toBe(true)
        })

        test('should reject malicious input', async () => {
            const parser = new CommandParser()
            const validator = new CommandValidator()

            const maliciousInputs = [
                'rm -rf /',
                'cat ../../../etc/passwd',
                '; rm -rf /',
                'test && rm -rf /',
            ]

            for (const input of maliciousInputs) {
                const parsed = parser.parse(input)
                const validation = validator.validate(parsed)
                expect(validation.valid).toBe(false)
            }
        })
    })
})
