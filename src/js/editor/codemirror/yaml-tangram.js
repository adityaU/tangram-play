import _ from 'lodash';
import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';
import './glsl-tangram';

import { tangramScene } from '../../map/map';

// Load some common functions
import { getInd } from './tools';

const ADDRESS_KEY_DELIMITER = ':';

//  GET public functions
//  ===============================================================================

// Get array of YAML keys parent tree of a particular line
export function getNodes (cm, nLine) {
    const lineHandle = cm.getLineHandle(nLine);

    // Return the nodes. If any property in the chain is not defined,
    // return an empty array.
    try {
        return lineHandle.stateAfter.yamlState.nodes;
    }
    catch (e) {
        return [];
    }
}

/**
 * Returns the content given an address
 * If for any reason the content is not found, return an empty string
 *
 * @param {Object} tangramScene - Tangram's parsed object tree of scene content
 * @param {string} address - in the form of 'key1:key2:key3'
 * @return {mixed} content - Whatever is stored as a value for that key
 */
export function getAddressSceneContent (tangramScene, address) {
    try {
        const keys = getKeysFromAddress(address);

        // Looks up content in Tangram's scene.config property.
        // It's a nested object, so to look up from an array of nested keys,
        // we reduce this array down to a single reference.
        // e.g. ['a', 'b', 'c'] looks up content in
        // tangramScene.config['a']['b']['c']
        const content = keys.reduce((obj, property) => {
            return obj[property];
        }, tangramScene.config);

        return content;
    }
    catch (error) {
        return '';
    }
}

/**
 * Return a string address from an array of key names
 *
 * @param {Array} keys - an array of keys
 * @return {string} address - in the form of 'key1:key2:key3'
 */
function getAddressFromKeys (keys) {
    return keys.join(ADDRESS_KEY_DELIMITER);
}

/**
 * Return an array of key names from an address
 * An empty string will still return an array whose first item
 * is the empty string.
 *
 * @param {string} address - in the form of 'key1:key2:key3'
 * @return {Array} keys
 */
export function getKeysFromAddress (address) {
    return address.split(ADDRESS_KEY_DELIMITER);
}

/**
 * Return a string address, truncated to a certain level
 *
 * @param {string} address  - in the form of 'key1:key2:key3'
 * @param {Number} level - the level of address to obtain
 * @return {string} address - truncated to maximum of `level`, e.g. 'key1:key2'
 */
export function getAddressForLevel (address, level) {
    const keys = getKeysFromAddress(address);
    const newKeys = keys.slice(0, level);
    return getAddressFromKeys(newKeys);
}

//  CHECK
//  ===============================================================================

/**
 * Detects if an address refers to a shader block. In Tangram syntax, six
 * blocks are defined. https://mapzen.com/documentation/tangram/shaders/#blocks
 *
 * A valid shader address will always begin with `styles:` and end in
 * `:shaders:blocks:__block__`, where __block__ is one of the six defined
 * shader blocks.
 *
 * @param {string} address - the address of the key-value pair
 * @return {Boolean} bool - `true` if address is a shader block
 */
function isShader (address) {
    const re = /shaders:blocks:(global|width|position|normal|color|filter)$/;
    return _.startsWith(address, 'styles') && re.test(address);
}

/**
 * The following functions are very similar and detects if an address refers to
 * a specific shader block. These are exported as helpers for other modules
 * to use. See documentation for types:
 * https://mapzen.com/documentation/tangram/shaders/#blocks
 *
 * A valid shader address will always begin with `styles:` and end in
 * `:shaders:blocks:__block__`, where __block__ is one of the six defined
 * shader blocks.
 *
 * @param {string} address - the address of the key-value pair
 * @return {Boolean} bool - `true` if address is a shader block of that type
 */
export function isGlobalBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:global');
}

export function isWidthBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:width');
}

export function isPositionBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:position');
}

export function isNormalBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:normal');
}

export function isColorBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:color');
}

export function isFilterBlock (address) {
    return _.startsWith(address, 'styles') && _.endsWith(address, 'shaders:blocks:filter');
}

/**
 * Detects if an address's contents (value) is JavaScript. In Tangram syntax,
 * JavaScript values must be a single function. This makes detection easy:
 * See if the beginning of the string starts with a valid function declaration.
 *
 * @param {Tangram.scene} tangramScene - scene object from Tangram
 * @param {string} address - the address of the key-value pair
 * @return {Boolean} bool - `true` if value appears to be a JavaScript function
 */
function isContentJS (tangramScene, address) {
    if (tangramScene && tangramScene.config) {
        const content = getAddressSceneContent(tangramScene, address);

        // Regex pattern. Content can begin with any amount of whitespace.
        // Where whitespace is allowed, it can be any amount of whitespace.
        // Content may begin with a pipe "|" character for YAML multi-line
        // strings. Next, test if "function () {" (with opening brace).
        const re = /^\s*\|?\s*function\s*\(\s*\)\s*\{/m;

        return re.test(content);
    }
    else {
        return false;
    }
}

function isAfterKey (str, pos) {
    let key = /^\s*(\w+):/gm.exec(str);
    if (key === undefined) {
        return true;
    }
    else {
        return [0].length < pos;
    }
}

//  Special Tangram YAML Parser
//  ===============================================================================

//  Get the address of a line state ( usually from the first key of a line )
function getKeyAddressFromState (state) {
    if (state.nodes && state.nodes.length > 0) {
        return state.nodes[0].address;
    }
    else {
        return '';
    }
}

function getAnchorFromValue (value) {
    if (/(^\s*(&\w+)\s+)/.test(value)) {
        let link = /(^\s*(&\w+)\s+)/gm.exec(value);
        return link[1];
    }
    else {
        return '';
    }
}

// function isNodeDuplicated(A) {
//     let B = TangramPlay.getNodesForAddress(A);
//     if (B === undefined){
//         return false;
//     }
//     return isNodeEqual(A, B);
// }

// function isNodeEqual (A, B) {
//     if (A && B && A.address && B.address && A.value && B.value) {
//         if (A.address !== B.address) {
//             return false;
//         }
//         if (A.value !== B.value) {
//             return false;
//         }
//         else if (A.range.from.line !== B.range.from.line) {
//             return false;
//         }
//         else if (A.range.to.line !== B.range.to.line) {
//             return false;
//         }
//         else if (A.range.to.ch !== B.range.to.ch) {
//             return false;
//         }
//         else if (A.range.from.ch !== B.range.from.ch) {
//             return false;
//         }
//         return true;
//     }
//     return true;
// }

// Given a YAML string return an array of keys
// TODO: We will need a different way of parsing YAML flow notation,
// since this function does not cover the full range of legal YAML specification
function getInlineNodes (str, nLine) {
    let rta = [];
    let stack = [];
    let i = 0;
    let level = 0;

    while (i < str.length) {
        let curr = str.substr(i, 1);
        if (curr === '{') {
            // Go one level up
            level++;
        }
        else if (curr === '}') {
            // Go one level down
            stack.pop();
            level--;
        }
        else {
            // check for keypair
            let isNode = /^\s*([\w|\-|_|\$]+)(\s*:\s*)([\w|\-|'|#]*)\s*/gm.exec(str.substr(i));
            if (isNode) {
                stack[level] = isNode[1];
                i += isNode[1].length;

                let key = isNode[1];
                let colon = isNode[2];
                let value = isNode[3];
                var isVector = str.substr(i + 1 + colon.length).match(/^\[\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*,\s*(\d\.|\d*\.?\d+)\s*\]/gm);
                if (isVector) {
                    value = isVector[0];
                }
                let anchor = getAnchorFromValue(value);
                value = value.substr(anchor.length);

                rta.push({
                    // This gets an array starting at index 1. This means that the
                    // result for address will come back as ':key1:key2:etc' because stack[0]
                    // is undefined, but it will still be joined in getAddressFromKeys()
                    address: getAddressFromKeys(stack),
                    key: key,
                    value: value,
                    anchor: anchor,
                    range: {
                        from: {
                            line: nLine,
                            ch: i + 1 - key.length },
                        to: {
                            line: nLine,
                            ch: i + colon.length + value.length + 1 },
                    },
                    index: rta.length + 1
                });
            }
        }
        i++;
    }
    return rta;
}

// Add Address to token states
function yamlAddressing (stream, state) {
    // Once per line compute the KEYS tree, NAME, ADDRESS and LEVEL.
    if (stream.pos === 0) {
        parseYamlString(stream.string, state, stream);
    }
}

// Add Address to token states
export function parseYamlString (string, state, stream) {
    // TODO:
    //  - add an extra \s* before the :
    //  - break all this into smaller and reusable functions
    //  - get rid of the pos
    //
    let regex = /(^\s*)([\w|\-|_|\/]+)(\s*:\s*)([\w|\W]*)\s*$/gm;
    let node = regex.exec(string);

    // node[0] = all the matching line
    // node[1] = spaces - DO NOT USE - use stream.indentation() instead.
    // node[2] = key
    // node[3] = "\s*:\s*"
    // node[4] = value (if there is one)
    //
    if (node) {
        //  If looks like a node
        //  Calculate the number of spaces and indentation level
        // TODO: Do not use tabSize to calculate level. Tab size is an editor
        // preference, and YAML specification does not depend on tab sizes
        // throughout a document to determine level. It is based on the number
        // of spaces indented beyond its parent.
        // NOTE: when getNodesForAddress is called, which calls parseYamlString,
        // stream is not provided and neither is identation / tabSize. This is
        // the only external use of parseYamlString()
        const spaces = stream.indentation();
        const level = Math.floor(spaces / stream.tabSize);

        //  Update the nodeS tree
        if (level > state.keyLevel) {
            state.keyStack.push(node[2]);
        }
        else if (level === state.keyLevel) {
            state.keyStack[level] = node[2];
        }
        else if (level < state.keyLevel) {
            let diff = state.keyLevel - level;
            for (let i = 0; i < diff; i++) {
                state.keyStack.pop();
            }
            state.keyStack[level] = node[2];
        }

        //  Record all that in the state value
        state.keyLevel = level;

        let address = getAddressFromKeys(state.keyStack);
        let fromCh = spaces;
        let toCh = spaces + node[2].length + node[3].length;

        if (node[4].substr(0, 1) === '{') {
            // If there are multiple keys
            state.nodes = [{
                address: address,
                key: node[2],
                value: '',
                anchor: '',
                range: {
                    from: {
                        line: state.line,
                        ch: fromCh
                    },
                    to: {
                        line: state.line,
                        ch: toCh
                    }
                },
                index: 0
            }];

            let subNodes = getInlineNodes(node[4], state.line);
            for (let i = 0; i < subNodes.length; i++) {
                subNodes[i].address = address + subNodes[i].address;
                subNodes[i].range.from.ch += spaces + node[2].length + node[3].length;
                subNodes[i].range.to.ch += spaces + node[2].length + node[3].length;
                state.nodes.push(subNodes[i]);
            }
        }
        else {
            let anchor = getAnchorFromValue(node[4]);
            toCh += node[4].length;
            state.nodes = [{
                address: address,
                key: node[2],
                anchor: anchor,
                value: node[4].substr(anchor.length),
                range: {
                    from: {
                        line: state.line,
                        ch: fromCh
                    },
                    to: {
                        line: state.line,
                        ch: toCh
                    }
                },
                index: 0
            }];
        }
    }
    else {
        // Commented or empty lines lines
        state.nodes = [{
            address: getAddressFromKeys(state.keyStack),
            key: '',
            value: '',
            anchor: '',
            range: {
                from: {
                    line: state.line,
                    ch: 0
                },
                to: {
                    line: state.line,
                    ch: 0
                }
            },
            index: 0
        }];
    }
}

//  YAML-TANGRAM
//  ===============================================================================
CodeMirror.defineMode('yaml-tangram', function (config, parserConfig) {
    // Import multiple modes used by Tangram YAML.
    const yamlMode = CodeMirror.getMode(config, 'yaml');
    const glslMode = CodeMirror.getMode(config, 'glsl');
    const jsMode = CodeMirror.getMode(config, 'javascript');

    // Specify YAML line comment character (not provided by CodeMirror).
    yamlMode.lineComment = '#';

    function yaml (stream, state) {
        const address = getKeyAddressFromState(state.yamlState);
        if (address !== undefined) {
            if (isShader(address) &&
                !/^\|$/g.test(stream.string) &&
                isAfterKey(stream.string, stream.pos)) {
                state.token = glsl;
                state.localMode = glslMode;
                state.localState = glslMode.startState(getInd(stream.string));
                return glsl(stream, state);
            }
            else if (isContentJS(tangramScene, address) &&
                        !/^\|$/g.test(stream.string) &&
                        isAfterKey(stream.string, stream.pos)) {
                state.token = js;
                state.localMode = jsMode;
                state.localState = jsMode.startState(getInd(stream.string));
                return js(stream, state);
            }
        }

        if (stream.pos === 0) {
            state.yamlState.line++;
        }

        return yamlMode.token(stream, state.yamlState);
    }

    function glsl (stream, state) {
        let address = getKeyAddressFromState(state.yamlState);
        if (!isShader(address) || (/^\|$/g.test(stream.string))) {
            state.token = yaml;
            state.localState = state.localMode = null;
            return null;
        }
        if (stream.pos === 0) {
            state.yamlState.line++;
        }
        return glslMode.token(stream, state.localState);
    }

    //  TODO:
    //        Replace global scene by a local
    //
    function js (stream, state) {
        let address = getKeyAddressFromState(state.yamlState);
        if (!isContentJS(tangramScene, address) || /^\|$/g.test(stream.string)) {
            state.token = yaml;
            state.localState = state.localMode = null;
            return null;
        }
        if (stream.pos === 0) {
            state.yamlState.line++;
        }
        return jsMode.token(stream, state.localState);
    }

    return {
        startState: function () {
            let state = yamlMode.startState();
            state.keyStack = [];
            state.keyLevel = -1;
            state.line = 0;
            return {
                token: yaml,
                localMode: null,
                localState: null,
                yamlState: state
            };
        },
        copyState: function (state) {
            let local;
            if (state.localState) {
                local = CodeMirror.copyState(state.localMode, state.localState);
            }
            return {
                token: state.token,
                localMode: state.localMode,
                localState: local,
                yamlState: CodeMirror.copyState(yamlMode, state.yamlState),
            };
        },
        innerMode: function (state) {
            return {
                state: state.localState || state.yamlState,
                mode: state.localMode || yamlMode
            };
        },
        // By default, CodeMirror skips blank lines when tokenizing a document.
        // We need to know the exact line number for our YAML addressing system.
        // CodeMirror allows a blankLine(state) method for languages with significant
        // blank lines, which we use solely to increment the line number on our state
        // object when a blank line is encountered by CodeMirror's parser.
        blankLine: function (state) {
            state.yamlState.line++;
        },
        token: function (stream, state) {
            yamlAddressing(stream, state.yamlState);
            return state.token(stream, state);
        },
        fold: 'indent'
    };
}, 'yaml', 'x-shader/x-fragment');

CodeMirror.defineMIME('text/x-yaml-tangram', 'yaml-tangram');
