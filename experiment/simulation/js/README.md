### This folder contains all the JavaScript files used in the simulation.

## File Structure

- **main.js**: Core simulator implementation with TomasuloSimulator class
- **components/**: Reusable UI components
  - **LatencyConfig.js**: Latency configuration interface component
- **utils/**: Utility modules
  - **types.js**: Type definitions and constants (instruction types, default latencies, categories)
  - **validation.js**: Input validation utilities
  - **feedbackGenerator.js**: User feedback and messaging
  - **tomasulo.js**: Additional Tomasulo algorithm utilities

## Features

- Interactive Tomasulo algorithm simulation
- Configurable instruction execution latencies
- Dual-mode operation (Configuration Mode / Simulation Mode)
- Register renaming and out-of-order execution visualization
- Common Data Bus monitoring
- Performance analysis and metrics
