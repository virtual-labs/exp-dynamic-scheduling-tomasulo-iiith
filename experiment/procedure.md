Follow these step-by-step instructions to understand and explore the Tomasulo Algorithm for dynamic scheduling using the interactive simulator.

### Step 1: Understanding the Interface

1. **Observe the Initial State**

   - Notice that all reservation stations start in the **Free** state
   - The register alias table shows all registers mapped to their architectural values
   - The instruction queue is empty and ready to accept instructions
   - All functional units are idle

2. **Familiarize with the Components**
   - **Instruction Input Panel**: Interface to add different types of instructions
   - **Reservation Stations**: Tables showing Add/Sub, Multiply/Divide, and Load/Store stations
   - **Register Alias Table**: Maps architectural registers to reservation station tags
   - **Functional Units Status**: Shows current execution status of each unit
   - **Common Data Bus Monitor**: Displays result broadcasts
   - **Instruction Timeline**: Visual representation of instruction flow through pipeline stages

### Step 2: Basic Instruction Issue

1. **Issue a Simple ADD Instruction**

   - In the instruction input panel, select **ADD** as the operation
   - Set destination register to **R1**
   - Set source registers to **R2** and **R3**
   - Click **"Issue Instruction"**

2. **Observe the Results**

   - A reservation station in the Add/Sub group becomes **Waiting**
   - Register R1 in the alias table now points to the reservation station tag
   - If R2 and R3 have values, they are copied; otherwise, tags are recorded
   - The instruction appears in the instruction timeline

3. **Issue Additional Instructions**
   - Add a few more instructions with different register dependencies
   - Observe how reservation stations fill up
   - Notice how register renaming eliminates false dependencies

### Step 3: Instruction Execution and Dependencies

1. **Create a True Dependency Chain**

   - Issue: `ADD R1, R2, R3`
   - Issue: `SUB R4, R1, R5` (depends on previous ADD)
   - Issue: `MUL R6, R4, R7` (depends on previous SUB)

2. **Monitor Execution Flow**

   - Click **"Step Execution"** or **"Run Simulation"**
   - Watch how the first ADD executes immediately (if operands available)
   - Observe SUB waiting for R1 value from the ADD instruction
   - Notice MUL waiting for R4 value from the SUB instruction

3. **Analyze Data Flow**
   - Follow values as they move through the Common Data Bus
   - See how results broadcast to all waiting instructions
   - Watch reservation stations transition: Waiting → Ready → Executing → Complete

### Step 4: Out-of-Order Execution

1. **Demonstrate Independent Instructions**

   - Issue a sequence like:
     ```
     ADD R1, R2, R3      // Takes 2 cycles
     MUL R4, R5, R6      // Takes 10 cycles
     SUB R7, R8, R9      // Takes 2 cycles, independent
     ADD R10, R11, R12   // Takes 2 cycles, independent
     ```

2. **Observe Out-of-Order Completion**
   - Start execution and watch the timeline
   - Notice that SUB and the second ADD complete before MUL
   - Instructions complete out of program order but maintain correctness
   - Resource utilization increases with parallel execution

### Step 5: Register Renaming Effects

1. **Create False Dependencies**

   - Issue instructions that demonstrate WAR and WAW hazards:
     ```
     ADD R1, R2, R3      // Write R1
     SUB R4, R1, R5      // Read R1 (RAW - true dependency)
     MUL R1, R6, R7      // Write R1 (WAW - false dependency)
     ADD R8, R4, R1      // Read R1 (should get MUL result)
     ```

2. **Analyze Renaming Behavior**
   - Watch how different writes to R1 get different reservation station tags
   - Observe that the SUB reads the first R1 value
   - Notice that the final ADD waits for the MUL result
   - Verify that register renaming eliminates the false WAW hazard

### Step 6: Load/Store Operations

1. **Memory Operations**

   - Issue load instructions: `LOAD R1, 100(R2)`
   - Issue store instructions: `STORE R3, 200(R4)`
   - Mix with computational instructions

2. **Address Calculation**
   - Watch how effective addresses are calculated
   - Observe memory unit utilization
   - Note variable latencies for cache hits/misses

### Step 7: Performance Analysis

1. **Measure Instruction Throughput**

   - Run a sequence of mixed instructions
   - Record issue rate, completion rate, and average cycles per instruction
   - Compare with in-order execution

2. **Resource Utilization Study**

   - Monitor reservation station occupancy
   - Track functional unit utilization
   - Identify bottlenecks in the system

3. **Hazard Impact Analysis**
   - Compare execution time with and without dependencies
   - Measure the effect of different instruction mixes
   - Analyze the impact of resource constraints

### Step 8: Advanced Scenarios

1. **Resource Contention**

   - Issue more instructions than available reservation stations
   - Observe structural hazards and stalling behavior
   - Study the impact of limited functional units

2. **Complex Dependency Patterns**

   - Create complex dependency chains and trees
   - Mix different instruction types with varying latencies
   - Analyze instruction scheduling decisions

3. **Performance Tuning**
   - Experiment with different numbers of reservation stations
   - Vary functional unit counts and latencies
   - Study the trade-offs in hardware complexity vs. performance

### Step 9: Comparative Analysis

1. **In-Order vs. Out-of-Order**

   - Use the comparison mode to see both execution styles
   - Measure performance differences
   - Understand when out-of-order provides benefits

2. **Different Instruction Mixes**
   - Test with compute-intensive workloads
   - Try memory-intensive patterns
   - Analyze mixed workload performance

### Step 10: Experiment Documentation

1. **Record Observations**

   - Document state transitions you observe
   - Note performance improvements achieved
   - Record any unexpected behaviors

2. **Answer Analysis Questions**

   - How does register renaming eliminate false dependencies?
   - What factors limit instruction-level parallelism?
   - How do resource constraints affect performance?

3. **Design Experiments**
   - Create scenarios to test specific aspects
   - Vary parameters to understand trade-offs
   - Compare with theoretical predictions
