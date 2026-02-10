/**
 * DEVELOPER TOOLS
 * Interactive utilities that run in the modal.
 *
 * CSP-compatible: no inline event handlers.
 * XSS-safe: user output uses textContent, not innerHTML.
 *
 * Each tool is a self-contained object (render + logic).
 * The world (loadTool) just places them and wires events.
 */

const DevTools = {
    /**
     * Load a tool into the workspace and bind its events
     */
    loadTool(toolType) {
        const workspace = document.getElementById('toolWorkspace');
        if (!workspace) {
            console.error('Tool workspace not found!');
            return;
        }

        let html = '';

        switch(toolType) {
            case 'calculator':
                html = this.calculator.render();
                break;
            case 'json-formatter':
                html = this.jsonFormatter.render();
                break;
            case 'base64':
                html = this.base64.render();
                break;
            default:
                html = '<p>Tool not found</p>';
        }

        workspace.innerHTML = html;
        this.bindToolEvents(workspace, toolType);

        // Scroll to workspace smoothly
        setTimeout(() => {
            workspace.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    },

    /**
     * Event delegation — one listener per workspace, no inline handlers
     */
    bindToolEvents(workspace, toolType) {
        workspace.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const param = btn.dataset.param;

            switch(toolType) {
                case 'calculator':
                    if (action === 'number') this.calculator.appendNumber(param);
                    else if (action === 'operator') this.calculator.setOperator(param);
                    else if (action === 'calculate') this.calculator.calculate();
                    else if (action === 'clear') this.calculator.clear();
                    break;
                case 'json-formatter':
                    if (action === 'format') this.jsonFormatter.format();
                    else if (action === 'minify') this.jsonFormatter.minify();
                    else if (action === 'validate') this.jsonFormatter.validate();
                    break;
                case 'base64':
                    if (action === 'encode') this.base64.encode();
                    else if (action === 'decode') this.base64.decode();
                    break;
            }
        });
    },

    /**
     * Calculator Tool
     */
    calculator: {
        render() {
            return `
                <div class="tool-container">
                    <div class="calculator">
                        <input type="text" id="calcDisplay" class="calc-display" readonly value="0">
                        <div class="calc-operation" id="calcOperation"></div>
                        <div class="calc-buttons">
                            <button class="calc-btn" data-action="number" data-param="7">7</button>
                            <button class="calc-btn" data-action="number" data-param="8">8</button>
                            <button class="calc-btn" data-action="number" data-param="9">9</button>
                            <button class="calc-btn calc-operator" data-action="operator" data-param="/">&#247;</button>

                            <button class="calc-btn" data-action="number" data-param="4">4</button>
                            <button class="calc-btn" data-action="number" data-param="5">5</button>
                            <button class="calc-btn" data-action="number" data-param="6">6</button>
                            <button class="calc-btn calc-operator" data-action="operator" data-param="*">&#215;</button>

                            <button class="calc-btn" data-action="number" data-param="1">1</button>
                            <button class="calc-btn" data-action="number" data-param="2">2</button>
                            <button class="calc-btn" data-action="number" data-param="3">3</button>
                            <button class="calc-btn calc-operator" data-action="operator" data-param="-">&#8722;</button>

                            <button class="calc-btn" data-action="number" data-param="0">0</button>
                            <button class="calc-btn" data-action="number" data-param=".">.</button>
                            <button class="calc-btn calc-equals" data-action="calculate">=</button>
                            <button class="calc-btn calc-operator" data-action="operator" data-param="+">+</button>

                            <button class="calc-btn calc-clear" data-action="clear" style="grid-column: span 4;">Clear</button>
                        </div>
                    </div>
                </div>
            `;
        },

        currentValue: '0',
        previousValue: '',
        operator: null,
        shouldResetDisplay: false,

        updateOperation() {
            const opDisplay = document.getElementById('calcOperation');
            if (opDisplay) {
                if (this.operator && this.previousValue) {
                    const opSymbol = {
                        '+': '+',
                        '-': '\u2212',
                        '*': '\u00D7',
                        '/': '\u00F7'
                    }[this.operator] || this.operator;
                    opDisplay.textContent = `${this.previousValue} ${opSymbol}`;
                } else {
                    opDisplay.textContent = '';
                }
            }
        },

        appendNumber(num) {
            const display = document.getElementById('calcDisplay');

            if (this.shouldResetDisplay) {
                this.currentValue = num;
                this.shouldResetDisplay = false;
            } else {
                if (num === '.' && this.currentValue.includes('.')) return;
                if (this.currentValue === '0' && num !== '.') {
                    this.currentValue = num;
                } else {
                    this.currentValue += num;
                }
            }

            display.value = this.currentValue;
        },

        setOperator(op) {
            if (this.operator && !this.shouldResetDisplay) {
                this.calculate();
            }

            this.operator = op;
            this.previousValue = this.currentValue;
            this.shouldResetDisplay = true;
            this.updateOperation();
        },

        calculate() {
            const display = document.getElementById('calcDisplay');

            if (!this.operator || !this.previousValue) return;

            const prev = parseFloat(this.previousValue);
            const current = parseFloat(this.currentValue);
            let result;

            switch(this.operator) {
                case '+': result = prev + current; break;
                case '-': result = prev - current; break;
                case '*': result = prev * current; break;
                case '/':
                    if (current === 0) {
                        display.value = 'Error';
                        this.clear();
                        return;
                    }
                    result = prev / current;
                    break;
                default: return;
            }

            result = Math.round(result * 100000000) / 100000000;
            this.currentValue = result.toString();
            display.value = this.currentValue;
            this.previousValue = '';
            this.operator = null;
            this.shouldResetDisplay = true;
            this.updateOperation();
        },

        clear() {
            this.currentValue = '0';
            this.previousValue = '';
            this.operator = null;
            this.shouldResetDisplay = false;
            const display = document.getElementById('calcDisplay');
            if (display) display.value = '0';
            this.updateOperation();
        }
    },

    /**
     * JSON Formatter Tool
     */
    jsonFormatter: {
        render() {
            return `
                <div class="tool-container">
                    <h3>JSON Formatter & Validator</h3>
                    <textarea id="jsonInput" class="tool-textarea" placeholder="Paste JSON here..."></textarea>
                    <div class="tool-buttons">
                        <button class="btn btn-primary" data-action="format">Format</button>
                        <button class="btn btn-secondary" data-action="minify">Minify</button>
                        <button class="btn btn-secondary" data-action="validate">Validate</button>
                    </div>
                    <div id="jsonOutput" class="tool-output"></div>
                </div>
            `;
        },

        format() {
            const input = document.getElementById('jsonInput').value;
            const output = document.getElementById('jsonOutput');
            try {
                const parsed = JSON.parse(input);
                output.textContent = JSON.stringify(parsed, null, 2);
                output.style.color = '#10b981';
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
                output.style.color = '#ef4444';
            }
        },

        minify() {
            const input = document.getElementById('jsonInput').value;
            const output = document.getElementById('jsonOutput');
            try {
                const parsed = JSON.parse(input);
                output.textContent = JSON.stringify(parsed);
                output.style.color = '#10b981';
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
                output.style.color = '#ef4444';
            }
        },

        validate() {
            const input = document.getElementById('jsonInput').value;
            const output = document.getElementById('jsonOutput');
            try {
                JSON.parse(input);
                output.textContent = '\u2713 Valid JSON!';
                output.style.color = '#10b981';
            } catch (error) {
                output.textContent = `\u2717 Invalid JSON: ${error.message}`;
                output.style.color = '#ef4444';
            }
        }
    },

    /**
     * Base64 Tool
     */
    base64: {
        render() {
            return `
                <div class="tool-container">
                    <h3>Base64 Encoder/Decoder</h3>
                    <textarea id="base64Input" class="tool-textarea" placeholder="Enter text to encode or Base64 to decode..."></textarea>
                    <div class="tool-buttons">
                        <button class="btn btn-primary" data-action="encode">Encode</button>
                        <button class="btn btn-primary" data-action="decode">Decode</button>
                    </div>
                    <div id="base64Output" class="tool-output"></div>
                </div>
            `;
        },

        encode() {
            const input = document.getElementById('base64Input').value;
            const output = document.getElementById('base64Output');
            try {
                output.textContent = btoa(input);
                output.style.color = '#10b981';
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
                output.style.color = '#ef4444';
            }
        },

        decode() {
            const input = document.getElementById('base64Input').value;
            const output = document.getElementById('base64Output');
            try {
                output.textContent = atob(input);
                output.style.color = '#10b981';
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
                output.style.color = '#ef4444';
            }
        }
    }
};

window.DevTools = DevTools;
