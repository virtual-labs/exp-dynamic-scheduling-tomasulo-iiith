// js/components/LatencyConfig.js

class LatencyConfig {
    constructor(containerId, simulator, onLatencyChange) {
        this.containerId = containerId;
        this.simulator = simulator;
        this.onLatencyChange = onLatencyChange;
    }

    render(readOnly = false) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        let html = '<div class="latency-config-container">';

        // Create a grid layout for the categories
        html += '<div class="columns is-multiline">';

        for (const [categoryName, instructions] of Object.entries(INSTRUCTION_CATEGORIES)) {
            html += `
                <div class="column is-half">
                    <div class="box">
                        <h4 class="subtitle is-5 has-text-centered">${categoryName}</h4>
                        <div class="latency-items">
            `;

            for (const { type, label } of instructions) {
                const currentLatency = this.simulator.latencies[type];
                html += `
                    <div class="field is-horizontal">
                        <div class="field-label is-normal">
                            <label class="label" for="latency-${type}">${label}</label>
                        </div>
                        <div class="field-body">
                            <div class="field has-addons">
                                <div class="control">
                                    <input
                                        type="number"
                                        id="latency-${type}"
                                        class="input latency-input ${readOnly ? 'is-static' : ''}"
                                        value="${currentLatency}"
                                        min="1"
                                        max="100"
                                        data-instruction-type="${type}"
                                        ${readOnly ? 'readonly' : ''}
                                    />
                                </div>
                                <div class="control">
                                    <a class="button is-static">cycles</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>'; // Close columns

        // Add info message based on mode
        if (readOnly) {
            html += `
                <div class="notification is-warning is-light">
                    <p>
                        <strong>ℹ️ Read-Only Mode:</strong> Latencies cannot be changed during simulation.
                        To modify latencies, reset the simulation and return to configuration mode.
                    </p>
                </div>
            `;
        } else {
            html += `
                <div class="notification is-info is-light">
                    <p>
                        <strong>💡 Tip:</strong> Configure the execution latencies for each instruction type.
                        These values determine how many cycles each operation takes to execute.
                        Higher latencies can help demonstrate the benefits of out-of-order execution.
                    </p>
                </div>
            `;
        }

        html += '</div>'; // Close container

        container.innerHTML = html;

        // Add event listeners to all inputs only if not read-only
        if (!readOnly) {
            this.attachEventListeners();
        }
    }

    attachEventListeners() {
        const inputs = document.querySelectorAll('.latency-input');
        
        inputs.forEach(input => {
            // Handle input change
            input.addEventListener('change', (e) => {
                const instructionType = e.target.dataset.instructionType;
                const newLatency = parseInt(e.target.value);

                // Validate input
                if (isNaN(newLatency) || newLatency < 1 || newLatency > 100) {
                    e.target.value = this.simulator.latencies[instructionType];
                    this.onLatencyChange({
                        success: false,
                        message: 'Latency must be between 1 and 100 cycles.',
                        type: instructionType
                    });
                    return;
                }

                // Update the simulator latencies
                const oldLatency = this.simulator.latencies[instructionType];
                this.simulator.latencies[instructionType] = newLatency;
                
                // Notify parent component
                this.onLatencyChange({
                    success: true,
                    message: `Updated ${instructionType} latency from ${oldLatency} to ${newLatency} cycles`,
                    type: instructionType,
                    oldLatency: oldLatency,
                    newLatency: newLatency
                });
            });

            // Prevent invalid input during typing
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value < 1) {
                    e.target.value = 1;
                } else if (value > 100) {
                    e.target.value = 100;
                }
            });

            // Select all text on focus for easy editing
            input.addEventListener('focus', (e) => {
                e.target.select();
            });
        });
    }

    // Update the display when latencies change externally
    updateDisplay() {
        const inputs = document.querySelectorAll('.latency-input');
        inputs.forEach(input => {
            const instructionType = input.dataset.instructionType;
            input.value = this.simulator.latencies[instructionType];
        });
    }
}
