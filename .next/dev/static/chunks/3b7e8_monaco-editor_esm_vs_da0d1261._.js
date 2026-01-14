(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/.pnpm/monaco-editor@0.55.1/node_modules/monaco-editor/esm/vs/nls.messages.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/ /*
 * This module exists so that the AMD build of the monaco editor can replace this with an async loader plugin.
 * If you add new functions to this module make sure that they are also provided in the AMD build of the monaco editor.
 *
 * TODO@esm remove me once we no longer ship an AMD build.
 */ __turbopack_context__.s([
    "getNLSLanguage",
    ()=>getNLSLanguage,
    "getNLSMessages",
    ()=>getNLSMessages
]);
function getNLSMessages() {
    return globalThis._VSCODE_NLS_MESSAGES;
}
function getNLSLanguage() {
    return globalThis._VSCODE_NLS_LANGUAGE;
}
;
}),
"[project]/node_modules/.pnpm/monaco-editor@0.55.1/node_modules/monaco-editor/esm/vs/nls.js [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "localize",
    ()=>localize,
    "localize2",
    ()=>localize2
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$monaco$2d$editor$40$0$2e$55$2e$1$2f$node_modules$2f$monaco$2d$editor$2f$esm$2f$vs$2f$nls$2e$messages$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/monaco-editor@0.55.1/node_modules/monaco-editor/esm/vs/nls.messages.js [app-client] (ecmascript)");
;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/ // eslint-disable-next-line local/code-import-patterns
const isPseudo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$monaco$2d$editor$40$0$2e$55$2e$1$2f$node_modules$2f$monaco$2d$editor$2f$esm$2f$vs$2f$nls$2e$messages$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNLSLanguage"])() === 'pseudo' || typeof document !== 'undefined' && document.location && typeof document.location.hash === 'string' && document.location.hash.indexOf('pseudo=true') >= 0;
function _format(message, args) {
    let result;
    if (args.length === 0) {
        result = message;
    } else {
        result = message.replace(/\{(\d+)\}/g, (match, rest)=>{
            const index = rest[0];
            const arg = args[index];
            let result = match;
            if (typeof arg === 'string') {
                result = arg;
            } else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === void 0 || arg === null) {
                result = String(arg);
            }
            return result;
        });
    }
    if (isPseudo) {
        // FF3B and FF3D is the Unicode zenkaku representation for [ and ]
        result = '\uFF3B' + result.replace(/[aouei]/g, '$&$&') + '\uFF3D';
    }
    return result;
}
/**
 * @skipMangle
 */ function localize(data /* | number when built */ , message /* | null when built */ , ...args) {
    if (typeof data === 'number') {
        return _format(lookupMessage(data, message), args);
    }
    return _format(message, args);
}
/**
 * Only used when built: Looks up the message in the global NLS table.
 * This table is being made available as a global through bootstrapping
 * depending on the target context.
 */ function lookupMessage(index, fallback) {
    const message = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$monaco$2d$editor$40$0$2e$55$2e$1$2f$node_modules$2f$monaco$2d$editor$2f$esm$2f$vs$2f$nls$2e$messages$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getNLSMessages"])()?.[index];
    if (typeof message !== 'string') {
        if (typeof fallback === 'string') {
            return fallback;
        }
        throw new Error(`!!! NLS MISSING: ${index} !!!`);
    }
    return message;
}
/**
 * @skipMangle
 */ function localize2(data /* | number when built */ , originalMessage, ...args) {
    let message;
    if (typeof data === 'number') {
        message = lookupMessage(data, originalMessage);
    } else {
        message = originalMessage;
    }
    const value = _format(message, args);
    return {
        value,
        original: originalMessage === message ? value : _format(originalMessage, args)
    };
}
;
}),
]);

//# sourceMappingURL=3b7e8_monaco-editor_esm_vs_da0d1261._.js.map