---
title: Java Backend Developer Intern - Second Round Interview
timestamp: 2026-02-23 00:00:00+08:00
series: Interview Experience
tags: [Java, Interview, Backend, Internship]
description: Boyan Java backend developer intern second round interview, covering message queues, containerization, WebSocket, design patterns, system performance optimization, and production troubleshooting
toc: true
---

**Position:** Java Backend Developer Intern
**Duration:** ~45 minutes
**Key Focus:** Complex project architecture (message queues, containerization, WebSocket), business落地 of design patterns, system performance optimization, production troubleshooting, and engineering mindset.

Compared to the first round, this second round interviewer (senior engineer) placed more emphasis on **technology selection thinking** and **production environment engineering mindset**. I gained a lot from this interview, especially the questioning about production troubleshooting made me realize the gap between student thinking and enterprise development. Here's the detailed recap.

---

## 1. Icebreaker & Deep Project Discussion (Online Judge OJ System)

> **Q1: Let's start with a brief self-introduction.**
> **Me:** Hello interviewer, I'm an undergraduate student in Software Engineering/Big Data, focusing on Java backend. Familiar with Spring Boot/Cloud, Redis, MySQL, MyBatis, and have some knowledge of Vue/React frontend. Major projects include a Spring Cache middleware extension, a microservices-based information management system, and my current core project - a LeetCode-like online coding judge (OJ) system.

> **Q2: You've done many projects. Which one is most memorable and challenging?**
> **Me:** The most memorable is the OJ online judge system I'm currently working on. Its business logic is relatively complex - I introduced **Docker** for environment isolation to implement code sandboxing; used **Kafka** for message queuing to handle peak shaving for high-concurrency code submissions; and implemented **WebSocket** communication between frontend and backend for real-time push of code execution results.

> **Q3: You mentioned WebSocket. How is it different from regular HTTP? Since WebSocket is so great (bidirectional communication), why do most mainstream websites still use HTTP?**
> **Me:**
> - **Difference:** HTTP is unidirectional, request-response based; after successful WebSocket handshake, a persistent connection is established where both server and client can proactively push data.
> - **Why not replace HTTP with WebSocket:** Maintaining long connections requires server connection pool resources and memory. Server concurrent connections are limited; if all requests used WebSocket, resources would be quickly exhausted. HTTP's "use and discard" (stateless, short connections or Keep-Alive) mode has better resource utilization for the vast majority of scenarios requiring only single data interactions, making it more dynamic and efficient.

> **Q4: Your code sandbox runs on Docker. What's the specific process? How do you prevent users from submitting malicious code that could crash the server?**
> **Me run code directly on:** I don't the host machine. Instead, I pre-build Docker images containing various target language environments (Java, Python, C++) and start corresponding containers.
> When a user submits code, the backend gets the code and test cases from the database, uses Java to call the Docker API to mount/pass files into the specified container directory, then calls preset scripts to execute and capture output. Since code runs inside Docker containers with CPU/memory limits, physical isolation protects the host machine.

> **Q5: What if the Docker container crashes during runtime? Do you have any health check mechanism?**
> **Me:**
> - **Current implementation:** I set `restart: always` in `docker-compose.yml`, letting the Docker engine handle health checks.
> - **Interviewer follow-up: How would you design it yourself?** I proposed writing a scheduled task in Java that uses Docker API to try获取 container metadata. If it fails, use **exponential backoff (stepped retry)**: wait a period after first failure, double the wait time after second failure... if it fails three consecutive times, determine the container is dead and trigger logic to run a new container. If the container is stuck/deadlocked, can introduce distributed locking for state marking.

> **Q6: Since you're using Docker, are you familiar with K8s (Kubernetes)? What's the difference between K8s and Docker?**
> **Me:** Docker is a single-machine container engine, suitable for individual developers or lightweight deployments. K8s is an enterprise-level distributed container orchestration system that manages clusters of multiple hosts (nodes). Running many Docker containers on a single server causes resource competition and performance degradation; K8s can reasonably schedule containers to nodes with sufficient resources in the cluster, ensuring high availability and stability.

> **Q7: You mentioned using Kafka for peak shaving. What's the specific scenario?**
> **Me:** For example, when the system hosts a coding competition, there will be many concurrent code submission requests in a short time. But Docker script startup and code execution are relatively time-consuming operations; if handled synchronously, server threads would quickly be saturated.
> So I send judge requests as messages to Kafka (producer), then let the judge service (consumer) asynchronously pull tasks from the queue based on its processing capacity. After execution completes, results are asynchronously pushed to the frontend via WebSocket.

---

## 2. Architecture Design & Design Patterns (Cache Middleware Project)

> **Q8: What design patterns have you used in your projects? What specific problems do they solve?**
> **Me:** In my Redis cache protection middleware, I used the **Chain of Responsibility pattern** (combined with Strategy pattern).
> Because the cache query flow is long: `Bloom filter validation -> check local cache -> check Redis -> add breakdown lock -> query database`. I abstracted each step as a node (Handler), passing data through a unified Context.
>
> - **Interviewer follow-up: Why use Chain of Responsibility? Isn't it over-engineering?**
> - **My answer:** Mainly for **high extensibility** and **observability**. Through the chain, I can easily insert monitoring nodes in the middle (e.g., tracking source query rate, lock competition count), and easily replace different implementations at the final "source DB" node (e.g., switching from MySQL to MongoDB) without modifying the core control logic.

---

## 3. Performance Optimization & Fundamentals

> **Q9: Your resume mentions performance optimization experience. Can you share a case where you optimized latency from seconds to milliseconds/lower seconds?**
> **Me:** In the campus information management system, there's a full Excel export feature for a million-row data table. Initially, using native JDBC loop queries and regular file writing made exports very slow (10s to 30s), and users clicking repeatedly caused server OOM or freezes.
> - **Optimization approach:** Introduced async task queues to cache and queue user export requests; also replaced the underlying export component with a streaming write component like EasyExcel to avoid loading large amounts of data into memory at once. Final optimization reduced time to ~5 seconds.
> - **Interviewer summary:** So your optimization mainly focused on application-level memory handling and asynchronization. The SQL level is still full table queries, right? (Me: Yes)

> **Q10: Your system uses JWT for authentication. What's the difference from the older Session mechanism?**
> **Me:**
> - **Session:** State stored in server memory, has scalability issues; in distributed environments, Session sharing is needed.
> - **JWT:** Stateless mechanism. Server validates credentials and issues Token, frontend stores it and carries it in subsequent request headers. Backend only needs to decrypt and validate with the secret key.
> To achieve JWT controllability (like actively kicking users, renewal), I combined Redis on the server side, storing issued Tokens in Redis with expiration times. Each time the interceptor validates successfully, it refreshes the survival time in Redis.

> **Q11: Do you still remember the OSI seven-layer model in computer networking?**
> **Me:** (Hadn't reviewed in a long time, being honest) Physical layer, Data link layer, Network layer, Transport layer, Application layer... missed the Session and Presentation layers in the middle.

---

## 4. The Tough Question: Production Troubleshooting (The Climax)

> **Q12: On Linux, if a machine has extremely high load, how do you find which process is causing it?**
> **Me:** Use the `top` command, which shows each process's CPU and memory usage.

> **Q13: After getting the process ID, how do you further pinpoint the issue?** (Key question!)
> **Me:** (At the time, I spontaneously said what I usually do on my own servers) **"After getting the process ID, I usually just `kill -9` it and be done with it..."**
>
> **Interviewer (laughing despite himself):** That's so brutal? If you do that in real production, you'll be blamed for production incidents!
>

> [!NOTE]
> The correct approach should be using `top -Hp <pid>` to see which specific thread is consuming CPU, then use `jstack` to dump thread snapshots, convert thread IDs to hex to compare in the snapshot file, and locate the specific code line causing infinite loops or Full GC - not directly killing the process!

---

## 5. Q&A with Interviewer & Feedback

> **Me:** After today's interview, do you have any feedback or suggestions for me? I'd like to know my improvement direction.
>
> **Interviewer Feedback:**
> 1. **Strengths:** Your project experience is very rich, you must have written a lot of code. And you're clear about your project chains (like sandbox, MQ usage, design patterns), with good technical breadth.
> 2. **Weaknesses (Fatal flaw):** Clearly **lacking real enterprise internship experience and engineering mindset**. The most typical is your earlier answer about troubleshooting (directly `kill -9`). In personal or school projects, that's fine, but in enterprise production environments, online troubleshooting is an extremely rigorous process.
> 3. **Conclusion:** You have a good foundation now, but need cultivation to become truly battle-ready. Suggest learning more about **production troubleshooting实战**, **production environment operations standards**, and some engineering knowledge.

---

## Summary & Reflections

This interview was a wake-up call! Although I stacked many fancy components (Docker, Kafka, WebSocket, design patterns) and spent a lot of effort "reinventing the wheel," I'm still in the student thinking stage of "if it runs, it's good."

**Especially my answer about troubleshooting exposed my shortcoming of lacking reverence for production environments.** In my follow-up review, I need to focus on filling gaps in practical experience like JVM tuning, production OOM troubleshooting, CPU spike analysis (using `jstack`, `jmap`, `arthas` tools).

Hope this reminds students still in campus recruitment or looking for internships: **Knowing how to use components is one thing; understanding how to troubleshoot, ensure availability, and handle disasters in production environments is the "advanced quality" that big tech interviewers truly value!**
