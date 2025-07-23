## Theory

### Introduction to Dynamic Scheduling

In modern processors, instruction throughput can be significantly improved by executing instructions out of their original program order. **Dynamic Scheduling** is a technique that allows the processor to rearrange instruction execution at runtime to minimize pipeline stalls and maximize resource utilization.

The main challenges in out-of-order execution are:
- **True Dependencies (RAW)**: A later instruction needs the result of an earlier instruction
- **Anti-dependencies (WAR)**: A later instruction writes to a register that an earlier instruction reads
- **Output Dependencies (WAW)**: Two instructions write to the same register

### The Tomasulo Algorithm

The **Tomasulo Algorithm**, developed by Robert Tomasulo at IBM in 1967 for the IBM 360/91, was one of the first dynamic scheduling algorithms. It enables out-of-order execution while maintaining program correctness through several key innovations:

#### Key Components

1. **Reservation Stations**
   - Buffer instructions waiting for execution
   - Store operand values or tags indicating where values will come from
   - Enable register renaming to eliminate false dependencies
   - Different types for different functional units (e.g., Add/Sub, Multiply/Divide, Load/Store)

2. **Common Data Bus (CDB)**
   - Broadcasts results to all reservation stations simultaneously
   - Updates waiting instructions with computed values
   - Maintains data consistency across the system

3. **Register Alias Table (RAT)**
   - Maps architectural registers to reservation station tags
   - Implements register renaming
   - Tracks which reservation station will produce each register's value

#### Instruction Processing Stages

1. **Issue Stage**
   - Decode instruction and check for available reservation station
   - If structural hazard exists (no free reservation station), stall
   - Allocate reservation station and update register alias table
   - Read available operands or record tags for unavailable ones

2. **Execute Stage**
   - Monitor common data bus for operand values
   - When all operands are available, begin execution
   - Execute instruction in the appropriate functional unit
   - Handle execution latencies (different for different operations)

3. **Write-back Stage**
   - Broadcast result on common data bus
   - Update all waiting instructions with the result
   - Free the reservation station
   - Update register file if this instruction produces the current value

#### Register Renaming Process

The Tomasulo algorithm implements **register renaming** through reservation stations:

- **Eliminate WAR Hazards**: Instructions read operand values early (during issue) or get them from CDB
- **Eliminate WAW Hazards**: Only the most recent instruction to write a register updates the register alias table
- **Preserve RAW Dependencies**: Instructions wait for their operands to be produced by earlier instructions

#### Functional Units

Typical implementation includes multiple functional units:

1. **Integer Units**
   - ADD/SUB operations
   - Fast execution (1-2 cycles)
   - Multiple units for parallel execution

2. **Floating-Point Units**
   - FADD/FSUB operations
   - Moderate execution latency (3-4 cycles)
   - Pipelined for high throughput

3. **Multiply/Divide Units**
   - FMUL/FDIV operations
   - High execution latency (10-20+ cycles)
   - May be non-pipelined (especially divide)

4. **Load/Store Units**
   - Memory access operations
   - Variable latency depending on cache hits/misses
   - Address calculation and memory hierarchy interaction

### Instruction Dispatch and Execution

#### Reservation Station States

Each reservation station can be in one of several states:

1. **Free**: Available for new instruction
2. **Waiting**: Instruction issued but waiting for operands
3. **Ready**: All operands available, ready for execution
4. **Executing**: Currently executing in functional unit
5. **Completed**: Execution finished, waiting to write back

#### Operand Handling

Operands in reservation stations can be:
- **Value**: Actual data value available immediately
- **Tag**: Reference to reservation station that will produce the value
- **Register**: Direct register reference (for architectural state)

#### Hazard Resolution

**Structural Hazards**: Resolved by stalling issue when no reservation stations are available

**Data Hazards**:
- **RAW**: Resolved by waiting for operand values on CDB
- **WAR**: Eliminated through early operand reading and register renaming
- **WAW**: Resolved through register renaming (latest write wins)

### Performance Implications

**Advantages:**
- Enables out-of-order execution without complex compiler analysis
- Dynamically adapts to runtime dependencies
- High instruction throughput when sufficient resources available
- Elegant handling of variable-latency operations

**Disadvantages:**
- Complex hardware implementation
- Requires significant silicon area for reservation stations
- Broadcast bus (CDB) can become bandwidth bottleneck
- Limited by number of reservation stations

### Modern Implementations

The Tomasulo algorithm forms the foundation for modern superscalar processors:

- **Register Renaming**: Extended with physical register files
- **Multiple Issue**: Combined with multiple instruction issue per cycle
- **Speculative Execution**: Enhanced with branch prediction and speculation
- **Memory Disambiguation**: Advanced load/store queue management

Understanding Tomasulo is essential for:
- Computer architecture design
- Performance optimization
- Compiler development
- Parallel programming concepts