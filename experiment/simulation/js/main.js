// Tomasulo Algorithm Dynamic Scheduling Simulator
// JavaScript implementation for educational purposes

class TomasuloSimulator {
    constructor() {
        this.initializeSystem();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initializeSystem() {
        // System state
        this.clockCycle = 0;
        this.pc = 0;
        this.instructionsIssued = 0;
        this.instructionsCompleted = 0;
        this.isRunning = false;
        this.runInterval = null;

        // Register file (R0-R7) with initial values
        this.registers = {
            R0: { value: 0, qi: null },
            R1: { value: 10, qi: null },
            R2: { value: 20, qi: null },
            R3: { value: 30, qi: null },
            R4: { value: 40, qi: null },
            R5: { value: 50, qi: null },
            R6: { value: 60, qi: null },
            R7: { value: 70, qi: null }
        };

        // Memory simulation
        this.memory = {};
        for (let i = 0; i < 1000; i++) {
            this.memory[i] = Math.floor(Math.random() * 100);
        }

        // Reservation Stations
        this.addSubStations = [];
        this.mulDivStations = [];
        this.loadStoreStations = [];

        // Initialize reservation stations
        for (let i = 0; i < 3; i++) {
            this.addSubStations.push({
                tag: `Add${i+1}`,
                busy: false,
                op: null,
                vj: null,
                vk: null,
                qj: null,
                qk: null,
                dest: null,
                execCyclesLeft: 0,
                instruction: null
            });
        }

        for (let i = 0; i < 2; i++) {
            this.mulDivStations.push({
                tag: `Mul${i+1}`,
                busy: false,
                op: null,
                vj: null,
                vk: null,
                qj: null,
                qk: null,
                dest: null,
                execCyclesLeft: 0,
                instruction: null
            });
        }

        for (let i = 0; i < 2; i++) {
            this.loadStoreStations.push({
                tag: `Load${i+1}`,
                busy: false,
                op: null,
                address: null,
                value: null,
                q: null,
                dest: null,
                execCyclesLeft: 0,
                instruction: null
            });
        }

        // Functional Units
        this.functionalUnits = {
            AddSub1: { busy: false, instruction: null, cyclesLeft: 0 },
            AddSub2: { busy: false, instruction: null, cyclesLeft: 0 },
            Mul1: { busy: false, instruction: null, cyclesLeft: 0 },
            Div1: { busy: false, instruction: null, cyclesLeft: 0 },
            Load1: { busy: false, instruction: null, cyclesLeft: 0 },
            Store1: { busy: false, instruction: null, cyclesLeft: 0 }
        };

        // Instruction timeline
        this.instructionQueue = [];
        this.completedInstructions = [];

        // Common Data Bus
        this.cdbLog = [];

        // Performance counters
        this.performance = {
            structuralHazards: 0,
            rawDependencies: 0,
            warEliminated: 0,
            wawEliminated: 0
        };

        // Execution latencies
        this.latencies = {
            ADD: 2,
            SUB: 2,
            MUL: 10,
            DIV: 20,
            LOAD: 3,
            STORE: 3
        };
    }

    setupEventListeners() {
        document.getElementById('issue-btn').addEventListener('click', () => this.issueInstruction());
        document.getElementById('step-btn').addEventListener('click', () => this.stepExecution());
        document.getElementById('run-btn').addEventListener('click', () => this.toggleRun());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetSimulation());

        // Update source 2 visibility based on operation
        document.getElementById('operation-select').addEventListener('change', (e) => {
            const isLoadStore = e.target.value === 'LOAD' || e.target.value === 'STORE';
            const src2Container = document.getElementById('src2-register').parentElement.parentElement.parentElement;
            src2Container.style.display = isLoadStore ? 'none' : 'block';
        });
    }

    issueInstruction() {
        const operation = document.getElementById('operation-select').value;
        const destReg = document.getElementById('dest-register').value;
        const src1Reg = document.getElementById('src1-register').value;
        const src2Reg = document.getElementById('src2-register').value;
        const memAddr = parseInt(document.getElementById('memory-address').value) || 0;
        const immediate = document.getElementById('immediate-value').value;

        const instruction = {
            pc: this.pc++,
            operation: operation,
            dest: destReg,
            src1: src1Reg,
            src2: operation === 'LOAD' || operation === 'STORE' ? null : src2Reg,
            address: operation === 'LOAD' || operation === 'STORE' ? memAddr : null,
            immediate: immediate ? parseInt(immediate) : null,
            issueCycle: null,
            executeStartCycle: null,
            executeEndCycle: null,
            writeBackCycle: null,
            status: 'waiting',
            reservationStation: null
        };

        if (this.tryIssue(instruction)) {
            this.instructionQueue.push(instruction);
            this.instructionsIssued++;
            this.updateDisplay();
            this.showMessage(`Issued: ${this.formatInstruction(instruction)}`, 'success');
        } else {
            this.performance.structuralHazards++;
            this.showMessage('Structural hazard: No available reservation station', 'error');
        }
    }

    tryIssue(instruction) {
        let stations, stationType;

        // Determine which type of reservation station to use
        if (instruction.operation === 'ADD' || instruction.operation === 'SUB') {
            stations = this.addSubStations;
            stationType = 'AddSub';
        } else if (instruction.operation === 'MUL' || instruction.operation === 'DIV') {
            stations = this.mulDivStations;
            stationType = 'MulDiv';
        } else if (instruction.operation === 'LOAD' || instruction.operation === 'STORE') {
            stations = this.loadStoreStations;
            stationType = 'LoadStore';
        }

        // Find free reservation station
        const freeStation = stations.find(station => !station.busy);
        if (!freeStation) {
            return false; // Structural hazard
        }

        // Issue the instruction
        this.clockCycle++;
        instruction.issueCycle = this.clockCycle;
        instruction.status = 'issued';
        instruction.reservationStation = freeStation.tag;

        // Configure reservation station
        freeStation.busy = true;
        freeStation.op = instruction.operation;
        freeStation.dest = instruction.dest;
        freeStation.instruction = instruction;

        if (stationType === 'LoadStore') {
            // Handle load/store operations
            if (instruction.operation === 'LOAD') {
                freeStation.address = instruction.address;
                // Update register alias table
                this.registers[instruction.dest].qi = freeStation.tag;
            } else { // STORE
                freeStation.address = instruction.address;
                // Check if source register has value or needs to wait
                if (this.registers[instruction.src1].qi) {
                    freeStation.q = this.registers[instruction.src1].qi;
                    freeStation.value = null;
                    this.performance.rawDependencies++;
                } else {
                    freeStation.value = this.registers[instruction.src1].value;
                    freeStation.q = null;
                }
            }
        } else {
            // Handle arithmetic operations
            // Check source operands
            if (this.registers[instruction.src1].qi) {
                freeStation.qj = this.registers[instruction.src1].qi;
                freeStation.vj = null;
                this.performance.rawDependencies++;
            } else {
                freeStation.vj = this.registers[instruction.src1].value;
                freeStation.qj = null;
            }

            if (instruction.src2) {
                if (this.registers[instruction.src2].qi) {
                    freeStation.qk = this.registers[instruction.src2].qi;
                    freeStation.vk = null;
                    this.performance.rawDependencies++;
                } else {
                    freeStation.vk = this.registers[instruction.src2].value;
                    freeStation.qk = null;
                }
            } else if (instruction.immediate !== null) {
                freeStation.vk = instruction.immediate;
                freeStation.qk = null;
            }

            // Update register alias table (register renaming)
            if (this.registers[instruction.dest].qi) {
                this.performance.wawEliminated++;
            }
            this.registers[instruction.dest].qi = freeStation.tag;
        }

        return true;
    }

    stepExecution() {
        this.clockCycle++;
        
        // Execute instructions
        this.executeInstructions();
        
        // Check for completed instructions
        this.checkCompletedInstructions();
        
        // Update display
        this.updateDisplay();
    }

    executeInstructions() {
        // Check each reservation station type
        this.executeStations(this.addSubStations, 'AddSub');
        this.executeStations(this.mulDivStations, 'MulDiv');
        this.executeStations(this.loadStoreStations, 'LoadStore');
    }

    executeStations(stations, type) {
        stations.forEach(station => {
            if (!station.busy) return;

            // Check if ready to execute
            if (station.execCyclesLeft === 0) {
                let ready = false;

                if (type === 'LoadStore') {
                    if (station.op === 'LOAD') {
                        ready = true; // Load can always execute
                    } else { // STORE
                        ready = station.q === null; // Store needs value to be ready
                    }
                } else {
                    ready = station.qj === null && station.qk === null;
                }

                if (ready && !station.instruction.executeStartCycle) {
                    // Start execution
                    station.instruction.executeStartCycle = this.clockCycle;
                    station.instruction.status = 'executing';
                    station.execCyclesLeft = this.latencies[station.op];
                }
            }

            // Decrement execution cycles
            if (station.execCyclesLeft > 0) {
                station.execCyclesLeft--;
                
                if (station.execCyclesLeft === 0) {
                    // Execution completed
                    station.instruction.executeEndCycle = this.clockCycle;
                    station.instruction.status = 'write-back';
                    this.writeBack(station);
                }
            }
        });
    }

    writeBack(station) {
        const instruction = station.instruction;
        instruction.writeBackCycle = this.clockCycle;
        instruction.status = 'completed';

        // Calculate result
        let result = 0;
        if (station.op === 'ADD') {
            result = station.vj + station.vk;
        } else if (station.op === 'SUB') {
            result = station.vj - station.vk;
        } else if (station.op === 'MUL') {
            result = station.vj * station.vk;
        } else if (station.op === 'DIV') {
            result = station.vk !== 0 ? Math.floor(station.vj / station.vk) : 0;
        } else if (station.op === 'LOAD') {
            result = this.memory[station.address] || 0;
        } else if (station.op === 'STORE') {
            this.memory[station.address] = station.value;
            result = station.value;
        }

        // Broadcast on Common Data Bus
        if (station.op !== 'STORE') {
            this.broadcastCDB(station.tag, result);
            
            // Update register if this station is still the producer
            if (this.registers[instruction.dest].qi === station.tag) {
                this.registers[instruction.dest].value = result;
                this.registers[instruction.dest].qi = null;
            }
        }

        // Free the reservation station
        this.freeReservationStation(station);
        
        // Move to completed instructions
        this.completedInstructions.push(instruction);
        this.instructionsCompleted++;
    }

    broadcastCDB(tag, value) {
        const broadcast = {
            cycle: this.clockCycle,
            tag: tag,
            value: value
        };
        
        this.cdbLog.unshift(broadcast);
        if (this.cdbLog.length > 10) {
            this.cdbLog.pop();
        }

        // Update waiting reservation stations
        this.updateWaitingStations(tag, value);
        
        this.showCDBActivity(broadcast);
    }

    updateWaitingStations(tag, value) {
        // Update all reservation station types
        [...this.addSubStations, ...this.mulDivStations, ...this.loadStoreStations].forEach(station => {
            if (station.qj === tag) {
                station.vj = value;
                station.qj = null;
            }
            if (station.qk === tag) {
                station.vk = value;
                station.qk = null;
            }
            if (station.q === tag) {
                station.value = value;
                station.q = null;
            }
        });
    }

    freeReservationStation(station) {
        station.busy = false;
        station.op = null;
        station.vj = null;
        station.vk = null;
        station.qj = null;
        station.qk = null;
        station.dest = null;
        station.execCyclesLeft = 0;
        station.instruction = null;
        station.address = null;
        station.value = null;
        station.q = null;
    }

    checkCompletedInstructions() {
        // Remove completed instructions from queue
        this.instructionQueue = this.instructionQueue.filter(inst => inst.status !== 'completed');
    }

    toggleRun() {
        if (this.isRunning) {
            this.stopRun();
        } else {
            this.startRun();
        }
    }

    startRun() {
        this.isRunning = true;
        document.getElementById('run-btn').innerHTML = '<i class="fas fa-pause"></i>&nbsp;Pause';
        document.getElementById('run-btn').className = 'button is-danger is-large';
        
        this.runInterval = setInterval(() => {
            this.stepExecution();
            
            // Stop if no more instructions to execute
            if (this.instructionQueue.length === 0) {
                this.stopRun();
            }
        }, 1000); // 1 second interval
    }

    stopRun() {
        this.isRunning = false;
        if (this.runInterval) {
            clearInterval(this.runInterval);
            this.runInterval = null;
        }
        document.getElementById('run-btn').innerHTML = '<i class="fas fa-play"></i>&nbsp;Run';
        document.getElementById('run-btn').className = 'button is-success is-large';
    }

    resetSimulation() {
        this.stopRun();
        this.initializeSystem();
        this.updateDisplay();
        this.showMessage('Simulation reset', 'info');
        
        // Clear CDB display
        document.getElementById('cdb-empty').style.display = 'block';
        document.getElementById('cdb-container').style.display = 'none';
        
        // Clear timeline
        document.getElementById('timeline-empty').style.display = 'block';
        document.getElementById('timeline-container').style.display = 'none';
    }

    updateDisplay() {
        this.updateSystemStatus();
        this.updateReservationStations();
        this.updateRegisterStatus();
        this.updateFunctionalUnits();
        this.updateInstructionTimeline();
        this.updatePerformanceMetrics();
    }

    updateSystemStatus() {
        document.getElementById('clock-cycle').textContent = this.clockCycle;
        document.getElementById('instructions-issued').textContent = this.instructionsIssued;
        document.getElementById('instructions-completed').textContent = this.instructionsCompleted;
        
        const ipc = this.clockCycle > 0 ? (this.instructionsCompleted / this.clockCycle).toFixed(2) : '0.00';
        document.getElementById('ipc').textContent = ipc;
    }

    updateReservationStations() {
        this.updateStationTable('addsub-stations', this.addSubStations, 'arithmetic');
        this.updateStationTable('muldiv-stations', this.mulDivStations, 'arithmetic');
        this.updateStationTable('loadstore-stations', this.loadStoreStations, 'memory');
    }

    updateStationTable(tableId, stations, type) {
        const tbody = document.getElementById(tableId);
        tbody.innerHTML = '';

        stations.forEach(station => {
            const row = document.createElement('tr');
            row.className = station.busy ? 'reservation-station busy' : 'reservation-station';

            if (type === 'arithmetic') {
                row.innerHTML = `
                    <td>${station.tag}</td>
                    <td><span class="status-indicator ${station.busy ? 'busy' : 'free'}"></span>${station.busy ? 'Yes' : 'No'}</td>
                    <td>${station.op || '-'}</td>
                    <td>${station.vj !== null ? station.vj : '-'}</td>
                    <td>${station.vk !== null ? station.vk : '-'}</td>
                    <td>${station.qj || '-'}</td>
                    <td>${station.qk || '-'}</td>
                `;
            } else {
                row.innerHTML = `
                    <td>${station.tag}</td>
                    <td><span class="status-indicator ${station.busy ? 'busy' : 'free'}"></span>${station.busy ? 'Yes' : 'No'}</td>
                    <td>${station.op || '-'}</td>
                    <td>${station.address !== null ? station.address : '-'}</td>
                    <td>${station.value !== null ? station.value : '-'}</td>
                    <td>${station.q || '-'}</td>
                `;
            }

            tbody.appendChild(row);
        });
    }

    updateRegisterStatus() {
        const tbody = document.getElementById('register-status');
        tbody.innerHTML = '';

        Object.keys(this.registers).forEach(regName => {
            const reg = this.registers[regName];
            const row = document.createElement('tr');
            row.className = `register-row ${reg.qi ? 'waiting' : ''}`;
            
            row.innerHTML = `
                <td>${regName}</td>
                <td>${reg.value}</td>
                <td>${reg.qi || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    updateFunctionalUnits() {
        const tbody = document.getElementById('functional-units');
        tbody.innerHTML = '';

        Object.keys(this.functionalUnits).forEach(unitName => {
            const unit = this.functionalUnits[unitName];
            const row = document.createElement('tr');
            row.className = `functional-unit ${unit.busy ? 'busy' : ''}`;
            
            row.innerHTML = `
                <td>${unitName}</td>
                <td><span class="status-indicator ${unit.busy ? 'executing' : 'free'}"></span>${unit.busy ? 'Busy' : 'Free'}</td>
                <td>${unit.instruction ? this.formatInstruction(unit.instruction) : '-'}</td>
                <td>${unit.cyclesLeft || '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    updateInstructionTimeline() {
        if (this.instructionQueue.length === 0 && this.completedInstructions.length === 0) {
            document.getElementById('timeline-empty').style.display = 'block';
            document.getElementById('timeline-container').style.display = 'none';
            return;
        }

        document.getElementById('timeline-empty').style.display = 'none';
        document.getElementById('timeline-container').style.display = 'block';

        const tbody = document.getElementById('timeline-body');
        tbody.innerHTML = '';

        [...this.instructionQueue, ...this.completedInstructions]
            .sort((a, b) => a.pc - b.pc)
            .forEach(instruction => {
                const row = document.createElement('tr');
                row.className = `timeline-entry ${instruction.status}`;
                
                row.innerHTML = `
                    <td>${instruction.pc}</td>
                    <td>${this.formatInstruction(instruction)}</td>
                    <td>${instruction.issueCycle || '-'}</td>
                    <td>${instruction.executeStartCycle || '-'}</td>
                    <td>${instruction.executeEndCycle || '-'}</td>
                    <td>${instruction.writeBackCycle || '-'}</td>
                    <td><span class="status-indicator ${instruction.status}"></span>${instruction.status}</td>
                `;
                
                tbody.appendChild(row);
            });
    }

    updatePerformanceMetrics() {
        document.getElementById('structural-hazards').textContent = this.performance.structuralHazards;
        document.getElementById('raw-dependencies').textContent = this.performance.rawDependencies;
        document.getElementById('war-eliminated').textContent = this.performance.warEliminated;
        document.getElementById('waw-eliminated').textContent = this.performance.wawEliminated;

        // Update utilization bars
        const addSubUtil = this.addSubStations.filter(s => s.busy).length / this.addSubStations.length * 100;
        const mulDivUtil = this.mulDivStations.filter(s => s.busy).length / this.mulDivStations.length * 100;
        const loadStoreUtil = this.loadStoreStations.filter(s => s.busy).length / this.loadStoreStations.length * 100;

        document.getElementById('addsub-utilization').value = addSubUtil;
        document.getElementById('muldiv-utilization').value = mulDivUtil;
        document.getElementById('loadstore-utilization').value = loadStoreUtil;
    }

    showCDBActivity(broadcast) {
        document.getElementById('cdb-empty').style.display = 'none';
        document.getElementById('cdb-container').style.display = 'block';

        const cdbLog = document.getElementById('cdb-log');
        const broadcastDiv = document.createElement('div');
        broadcastDiv.className = 'cdb-broadcast';
        broadcastDiv.innerHTML = `
            <strong>Cycle ${broadcast.cycle}:</strong> ${broadcast.tag} broadcasts value ${broadcast.value}
        `;
        
        cdbLog.insertBefore(broadcastDiv, cdbLog.firstChild);
        
        // Keep only last 5 broadcasts visible
        while (cdbLog.children.length > 5) {
            cdbLog.removeChild(cdbLog.lastChild);
        }
    }

    formatInstruction(instruction) {
        if (instruction.operation === 'LOAD') {
            return `LOAD ${instruction.dest}, ${instruction.address}(${instruction.src1})`;
        } else if (instruction.operation === 'STORE') {
            return `STORE ${instruction.src1}, ${instruction.address}(${instruction.dest})`;
        } else {
            return `${instruction.operation} ${instruction.dest}, ${instruction.src1}, ${instruction.src2 || instruction.immediate || ''}`;
        }
    }

    showMessage(message, type) {
        // Simple message display - could be enhanced with notifications
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize simulator when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.simulator = new TomasuloSimulator();
});

// Demo instructions function for quick testing
function loadDemoInstructions() {
    const demo = [
        { op: 'ADD', dest: 'R1', src1: 'R2', src2: 'R3' },
        { op: 'SUB', dest: 'R4', src1: 'R1', src2: 'R5' },
        { op: 'MUL', dest: 'R6', src1: 'R4', src2: 'R7' },
        { op: 'ADD', dest: 'R2', src1: 'R6', src2: 'R1' }
    ];

    demo.forEach((inst, i) => {
        setTimeout(() => {
            document.getElementById('operation-select').value = inst.op;
            document.getElementById('dest-register').value = inst.dest;
            document.getElementById('src1-register').value = inst.src1;
            document.getElementById('src2-register').value = inst.src2;
            window.simulator.issueInstruction();
        }, i * 500);
    });
}
