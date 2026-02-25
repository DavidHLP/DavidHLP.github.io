---
title: Linux High CPU Process Troubleshooting and Temporary Handling Guide
timestamp: 2026-02-25 00:00:00+08:00
tags: [Linux, Operations, Troubleshooting]
description: A comprehensive guide on quickly identifying high CPU processes in Linux systems, using kill -STOP to temporarily pause processes to prevent system freezes, and thoroughly investigating abnormal causes.
toc: true
---

In Linux systems, troubleshooting high CPU processes, analyzing causes, and temporarily pausing processes to prevent system freezes are standard operational procedures. Here is a detailed step-by-step guide:

---

## Step 1: Quickly Locate High CPU Processes

When system load is too high, the first step is to identify which process (PID) is consuming CPU.

### 1. Using `top` Command (Real-time View)

Enter `top`, and then:

- It sorts by CPU usage by default. If not, press **`P`** (uppercase) to force sorting by CPU.
- Observe the `%CPU` column to find the PID and command name (`COMMAND`) of the most resource-intensive process.
- Note down the **PID** (e.g., 12345).

### 2. Using `htop` Command (More Intuitive Interface, if installed)

Enter `htop` for a more friendly interface with mouse-click header sorting and clearer color distinctions.

### 3. Using `ps` Command (One-time Snapshot)

If `top` freezes and you cannot input, use this command to directly list the top 10 high CPU processes:

```bash
ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu | head -n 11
```

---

## Step 2: Emergency Temporary Pause Process (Prevent Freeze)

Before deep investigation, if CPU has spiked to 100% causing extremely slow system response, to pause the process **the priority is** to release CPU resources, rather than killing it directly, as killing may lose field information or cause business logic errors.

### Method A: Using `kill -STOP` (Recommended)

This is the safest method. It puts the process in a "stopped" state (State is `T`), consuming no CPU while retaining memory and context, ready to be resumed at any time.

```bash
# Syntax: kill -STOP <PID>
# Example: Pause process with PID 12345
sudo kill -STOP 12345
```

- **Effect**: Process immediately stops running, CPU usage drops to zero.
- **Recovery**: After investigation, use `sudo kill -CONT 12345` to resume execution.

### Method B: Using `killall -STOP` (Pause by Name)

If you know the process name but not the specific PID, or have multiple processes with the same name:

```bash
# Example: Pause all processes named java
sudo killall -STOP java
```

### Method C: Adjust Priority (Reduce Priority, Not Full Pause)

If you don't want to fully pause, but just want it to use less CPU, you can set the priority to the lowest (Nice value maximum is 19):

```bash
# Syntax: renice -n 19 -p <PID>
sudo renice -n 19 -p 12345
```

> [!WARNING]
> If the process is a dead-loop calculation, even with the highest Nice value, a single-core CPU may still be fully occupied. In this case, you must use `STOP`.

---

## Step 3: Deep Investigation of Abnormal Causes

After the process is paused, the system returns to normal, and you can calmly analyze the causes.

### 1. View Process Detailed Information

```bash
# View process start command, path, user, etc.
ps -ef | grep <PID>
# Or view more detailed status
cat /proc/<PID>/status
```

### 2. View Process Open Files and Network Connections

High CPU is sometimes due to large amounts of file I/O waits or network packet processing.

```bash
# View open files
ls -l /proc/<PID>/fd
# View network connections (needs netstat or ss)
ss -antp | grep <PID>
# Or use lsof
lsof -p <PID>
```

### 3. Capture Stack Information (Core Step)

To know where the code is stuck, you need to view thread stacks.

#### For Java Processes

Use the `jstack` tool (included with JDK):

```bash
jstack -l <PID> > /tmp/java_stack.log
```

Analyze the threads in `RUNNABLE` state in the log to see which line of code it stopped at.

#### For C/C++/Go/Python and Other Native Processes

Use `gdb` (GNU Debugger) to attach to the process (**Note: The process must be in running state to see real-time stacks. If it's in STOP state, after attaching gdb you need to continue it once then interrupt, or directly analyze core dump**).

*Simple method: Use `pstack` (if installed)*

```bash
pstack <PID>
```

*General method: Use `gdb`*

```bash
# 1. First resume the process (to capture live stack, usually need to let it run briefly then interrupt, or attach directly)
sudo kill -CONT <PID>

# 2. Attach gdb
sudo gdb -p <PID>

# 3. In gdb interactive interface, immediately send interrupt signal (Ctrl+C)
# Then enter bt (backtrace) to view stack
(gdb) bt full
# View all threads
(gdb) thread apply all bt
# Exit gdb (without killing process)
(gdb) detach
(gdb) quit
```

### 4. Using `perf` for Performance Profiling (Advanced)

If you need to know which specific function is consuming CPU:

```bash
# Record 10 seconds of data
sudo perf record -F 99 -p <PID> -g -- sleep 10
# Generate report
sudo perf report
```

This will display flame graph data, intuitively showing which function call stack is most time-consuming.

### 5. Check System Logs

Check for related errors:

```bash
dmesg -T | tail -n 50
grep <PID> /var/log/syslog  # or /var/log/messages
```

---

## Step 4: Follow-up Processing

Decide on operations based on investigation results:

### 1. If It's Temporary Fluctuation/Known Issue

Resume the process to continue running:

```bash
sudo kill -CONT <PID>
```

### 2. If It's Dead Loop/Bug/Malicious Program

Terminate the process directly:

```bash
# Graceful termination (allows program to clean up resources)
sudo kill -TERM <PID>

# Force kill (if TERM is ineffective)
sudo kill -KILL <PID>
```

### 3. Long-term Prevention

- Configure `systemd` service `CPUQuota` to limit the service to a maximum percentage of CPU.
- Optimize code logic.
- Deploy monitoring alerts (e.g., Prometheus + Alertmanager) to automatically intervene when CPU spikes.

---

## Summary Flowchart

1. **Detect Lag** -> `top` find PID.
2. **Emergency Hemostasis** -> `kill -STOP <PID>` (Key step, prevents freeze).
3. **Calm Analysis** -> `jstack` / `gdb` / `perf` / `lsof` find cause.
4. **Decision Execution** -> `kill -CONT` (Resume) or `kill -KILL` (Kill).
