// js/utils/types.js
// Constants and type definitions for Tomasulo simulator

const INSTRUCTION_TYPES = {
    // Arithmetic operations
    ADD: 'ADD',
    SUB: 'SUB',
    MUL: 'MUL',
    DIV: 'DIV',
    
    // Memory operations
    LOAD: 'LOAD',
    STORE: 'STORE'
};

// Default latencies for each instruction type
const DEFAULT_LATENCIES = {
    [INSTRUCTION_TYPES.ADD]: 2,
    [INSTRUCTION_TYPES.SUB]: 2,
    [INSTRUCTION_TYPES.MUL]: 10,
    [INSTRUCTION_TYPES.DIV]: 20,
    [INSTRUCTION_TYPES.LOAD]: 3,
    [INSTRUCTION_TYPES.STORE]: 3
};

// Instruction categories for UI organization
const INSTRUCTION_CATEGORIES = {
    'Arithmetic Operations': [
        { type: INSTRUCTION_TYPES.ADD, label: 'Add (ADD)' },
        { type: INSTRUCTION_TYPES.SUB, label: 'Subtract (SUB)' }
    ],
    'Multiply/Divide Operations': [
        { type: INSTRUCTION_TYPES.MUL, label: 'Multiply (MUL)' },
        { type: INSTRUCTION_TYPES.DIV, label: 'Divide (DIV)' }
    ],
    'Memory Operations': [
        { type: INSTRUCTION_TYPES.LOAD, label: 'Load (LOAD)' },
        { type: INSTRUCTION_TYPES.STORE, label: 'Store (STORE)' }
    ]
};
