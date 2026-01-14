# Code Execution APIs

## Available Execution Backends

### 1. **Browser-Based (Client-Side)**
- ✅ **JavaScript/TypeScript** - Web Workers
- ✅ **Python** - Pyodide (WebAssembly)
- **Pros**: Fast, offline, no API limits
- **Cons**: Limited to JS/Python, no file system access

### 2. **Judge0 API** (Default)
- 🌐 **API**: https://judge0.com
- **Languages**: 60+ languages
- **Pros**: Most comprehensive, well-documented
- **Cons**: Requires API key, rate limits
- **Setup**: Set `NEXT_PUBLIC_JUDGE0_API_KEY` and `NEXT_PUBLIC_JUDGE0_API_URL`

### 3. **Piston API** (Open Source)
- 🌐 **API**: https://github.com/engineer-man/piston
- **Public Endpoint**: https://emkc.org/api/v2/piston
- **Languages**: 50+ languages
- **Pros**: Free, open source, no API key needed
- **Cons**: Public instance may have rate limits
- **Usage**: Works out of the box, no configuration needed

### 4. **JDoodle API**
- 🌐 **API**: https://www.jdoodle.com/compiler-api
- **Languages**: 70+ languages
- **Pros**: Reliable, good documentation
- **Cons**: Requires API credentials, free tier limits
- **Setup**: Set `NEXT_PUBLIC_JDOODLE_CLIENT_ID` and `NEXT_PUBLIC_JDOODLE_CLIENT_SECRET`

### 5. **OneCompiler API**
- 🌐 **API**: https://onecompiler.com/api
- **Languages**: 60+ languages
- **Pros**: Simple API, good performance
- **Cons**: May require authentication for heavy usage
- **Usage**: Works out of the box for basic usage

## Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Judge0 (Primary)
NEXT_PUBLIC_JUDGE0_API_KEY=your_api_key_here
NEXT_PUBLIC_JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# JDoodle (Alternative)
NEXT_PUBLIC_JDOODLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_JDOODLE_CLIENT_SECRET=your_client_secret

# Execution Backend Selection
NEXT_PUBLIC_EXECUTION_BACKEND=piston  # Options: judge0, piston, jdoodle, onecompiler
```

## Switching Execution Backends

The system automatically falls back to alternative APIs if the primary one fails:

1. **Judge0** (if configured)
2. **Piston** (free, no config needed)
3. **Browser** (for JS/Python)

### Manual Selection

You can force a specific backend by setting:
```bash
NEXT_PUBLIC_EXECUTION_BACKEND=piston
```

## API Comparison

| Feature | Judge0 | Piston | JDoodle | OneCompiler | Browser |
|---------|--------|--------|---------|-------------|---------|
| **Languages** | 60+ | 50+ | 70+ | 60+ | 2 |
| **Free Tier** | Limited | Yes | 200/day | Limited | Unlimited |
| **API Key** | Required | No | Required | Optional | N/A |
| **Speed** | Fast | Medium | Fast | Fast | Very Fast |
| **Reliability** | High | Medium | High | Medium | High |
| **Offline** | No | No | No | No | Yes |

## Supported Languages by Backend

### All Backends Support:
- JavaScript/TypeScript
- Python
- Java
- C/C++
- C#
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- Scala

### Browser Only:
- JavaScript/TypeScript (Web Workers)
- Python (Pyodide)

## Getting API Keys

### Judge0
1. Visit https://rapidapi.com/judge0-official/api/judge0-ce
2. Subscribe to a plan
3. Copy your API key

### JDoodle
1. Visit https://www.jdoodle.com/compiler-api
2. Sign up for free account
3. Get client ID and secret

## Recommendations

**For Production:**
- Use **Judge0** with paid plan for reliability
- Configure **Piston** as fallback

**For Development:**
- Use **Piston** (free, no setup)
- Use **Browser** for JS/Python (fastest)

**For Free Tier:**
- Use **Piston** as primary
- Use **Browser** for JS/Python
- Configure **JDoodle** for additional quota
