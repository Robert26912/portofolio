/**
 * DEVELOPER TOOLS
 * Interactive utilities that run in the modal
 */

const DevTools = {
    /**
     * Load a tool into the workspace
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
        workspace.scrollIntoView({ behavior: 'smooth' });
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
                        <div class="calc-buttons">
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('7')">7</button>
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('8')">8</button>
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('9')">9</button>
                            <button class="calc-btn calc-operator" onclick="DevTools.calculator.setOperator('/')">÷</button>
                            
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('4')">4</button>
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('5')">5</button>
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('6')">6</button>
                            <button class="calc-btn calc-operator" onclick="DevTools.calculator.setOperator('*')">×</button>
                            
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('1')">1</button>
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('2')">2</button>
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('3')">3</button>
                            <button class="calc-btn calc-operator" onclick="DevTools.calculator.setOperator('-')">−</button>
                            
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('0')">0</button>
                            <button class="calc-btn" onclick="DevTools.calculator.appendNumber('.')">.</button>
                            <button class="calc-btn calc-equals" onclick="DevTools.calculator.calculate()">=</button>
                            <button class="calc-btn calc-operator" onclick="DevTools.calculator.setOperator('+')">+</button>
                            
                            <button class="calc-btn calc-clear" onclick="DevTools.calculator.clear()" style="grid-column: span 4;">Clear</button>
                        </div>
                    </div>
                </div>
            `;
        },
        
        currentValue: '0',
        previousValue: '',
        operator: null,
        
        appendNumber(num) {
            const display = document.getElementById('calcDisplay');
            if (this.currentValue === '0') {
                this.currentValue = num;
            } else {
                this.currentValue += num;
            }
            display.value = this.currentValue;
        },
        
        setOperator(op) {
            this.operator = op;
            this.previousValue = this.currentValue;
            this.currentValue = '0';
        },
        
        calculate() {
            const display = document.getElementById('calcDisplay');
            const prev = parseFloat(this.previousValue);
            const current = parseFloat(this.currentValue);
            let result;
            
            switch(this.operator) {
                case '+': result = prev + current; break;
                case '-': result = prev - current; break;
                case '*': result = prev * current; break;
                case '/': result = prev / current; break;
                default: return;
            }
            
            this.currentValue = result.toString();
            display.value = this.currentValue;
            this.operator = null;
        },
        
        clear() {
            this.currentValue = '0';
            this.previousValue = '';
            this.operator = null;
            document.getElementById('calcDisplay').value = '0';
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
                        <button class="btn btn-primary" onclick="DevTools.jsonFormatter.format()">Format</button>
                        <button class="btn btn-secondary" onclick="DevTools.jsonFormatter.minify()">Minify</button>
                        <button class="btn btn-secondary" onclick="DevTools.jsonFormatter.validate()">Validate</button>
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
                const formatted = JSON.stringify(parsed, null, 2);
                output.innerHTML = `<pre>${formatted}</pre>`;
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
                const minified = JSON.stringify(parsed);
                output.innerHTML = `<pre>${minified}</pre>`;
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
                output.textContent = '✓ Valid JSON!';
                output.style.color = '#10b981';
            } catch (error) {
                output.textContent = `✗ Invalid JSON: ${error.message}`;
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
                        <button class="btn btn-primary" onclick="DevTools.base64.encode()">Encode</button>
                        <button class="btn btn-primary" onclick="DevTools.base64.decode()">Decode</button>
                    </div>
                    <div id="base64Output" class="tool-output"></div>
                </div>
            `;
        },
        
        encode() {
            const input = document.getElementById('base64Input').value;
            const output = document.getElementById('base64Output');
            try {
                const encoded = btoa(input);
                output.innerHTML = `<pre>${encoded}</pre>`;
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
                const decoded = atob(input);
                output.innerHTML = `<pre>${decoded}</pre>`;
                output.style.color = '#10b981';
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
                output.style.color = '#ef4444';
            }
        }
    }
};

// Expose DevTools globally so buttons can access it
window.DevTools = DevTools;