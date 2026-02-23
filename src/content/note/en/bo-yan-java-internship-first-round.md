---
title: Boyan Java Backend Developer Intern - First Round Interview
timestamp: 2026-02-23 00:00:00+08:00
series: Interview Experience
tags: [Java, Interview, Backend, Internship]
description: Boyan Java backend developer intern first round interview, covering Redis caching, Docker containerization, Java collection fundamentals, and more
toc: true
---

**Position:** Java Backend Developer Intern
**Interview Format:** Voice Call
**Duration:** ~30 minutes
**Key Focus:** Project depth (Redis caching, Docker containerization), troubleshooting mindset, Java collection fundamentals

Overall, the interviewer focused heavily on practical implementation details, especially cache optimization and Docker usage. Here's the detailed recap.

---

## 1. Self-Introduction & Deep Project Discussion

> **Q1: You've prepared well. Let's start with a brief self-introduction.**
> **Me:** Hello interviewer, I'm a sophomore majoring in Software Engineering, focusing on Java backend development. I'm familiar with common middleware and underlying databases. Recently, I worked on a Spring Cache-based utility library, focusing on Redis-related business optimizations.

> **Q2: Tell me more about your Spring Cache extension. How does it solve the three major cache problems?**
> **Me:** It prevents cache penetration, cache breakdown, and cache avalanche through the entire chain:
> - **Cache Penetration:** Uses a **dual-layer Bloom filter** (JVM-level BitSet + Redis Hash). Requests first check the JVM-level Bloom filter, then Redis if needed. Even empty results from the database are cached to prevent future hits on the database.
> - **Cache Breakdown:** Introduces JVM-level locking. When many concurrent requests target the same key, only one request gets through to acquire the Redis lock and query the database. A local hash cache at the JVM level handles subsequent requests, reducing network I/O.
> - **Cache Avalanche:** Implements **TTL random perturbation** (±30% random variation on original expiration time) to prevent mass key expiration. Also includes a pre-refresh mechanism that asynchronously extends expiration times during requests.

> **Q3: Your capstone project is a LeetCode-like online coding platform. How is the core "code sandbox (test case execution)" implemented?**
> **Me:** Since the frontend is still iterating, the backend is currently written in NestJS and will later migrate to Spring Cloud. The code sandbox implementation process:
> 1. When users click run on the frontend, small local tests are converted to JS and run in the browser with sample cases.
> 2. For code submissions, the frontend sends the code to the backend, which packages it into an executable file.
> 3. The backend calls the **Docker API** to send the code file into pre-deployed Docker containers (Java/Python/C++ etc.) running in Linux (WSL2).
> 4. Containers run the code using preset scripts and return JSON-formatted execution results via stdout.
> 5. The backend parses the JSON, compares it with expected results (test cases) from the database, and calculates scores.

> **Q4: How are your Docker containers deployed and run? What's the command to enter a container?**
> **Me:** Containers for different languages are isolated. I customize `Dockerfile` and build images using `docker build`. For running multiple services, I write `docker-compose.yml` files and use `docker-compose up -d` for one-click orchestration and background execution.
> The command to enter a container: `docker exec -it <container_name_or_id> /bin/bash`

> **Q5: You also have a campus intranet project (interest class feedback) using ECharts and MySQL multi-dimensional statistics. How did you implement that?**
> **Me:** Primarily for providing visualization dashboards to school leadership. For example, to count "feedback per department," the backend uses MySQL `GROUP BY` aggregation queries, with department names as X-axis (Key) and feedback count as Y-axis (Value). The backend assembles this into a `Map` structure to return to the frontend, which renders it as ECharts bar or line charts.

---

## 2. Development Tools & Troubleshooting

> **Q6: Maven is essential for Spring Boot projects. What Maven commands do you commonly use?**
> **Me:** Most commonly used: `mvn clean` (clean compiled files), `mvn install` (package and install to local repository), and `mvn deploy` (deploy to remote repository).

> **Q7: Scenario Question: A button on the frontend shows an error or has no response. How would you troubleshoot this as a backend developer?**
> **Me:**
> 1. **Confirm the endpoint:** Open browser's `F12` developer tools and check the Network panel.
> 2. **Analyze status codes:** `404` might mean incorrect endpoint; `401/403` means permission issues; `500` indicates backend errors. If it's a frontend syntax error, it's a frontend issue.
> 3. **Backend investigation:** After confirming it's a backend error, check server or console logs for Error output to locate the specific exception stack trace.
> 4. **Debugging:** If no obvious error logs but logic fails, I'll add breakpoints (Debug) at the corresponding Controller in IDEA, resend the request, and step through to check input parameters and intermediate variables to locate the exact error line.

---

## 3. Java Basics & Collection Framework

> **Q8: Coding/Logic Question: How to reverse a string? (e.g., 12345 becomes 54321)**
> **Me:**
> - **Approach 1 (Two-pointer swap):** Create head and tail pointers, move toward each other and swap elements until they meet.
> - **Approach 2 (Reverse traversal):** Without considering space overhead, convert the string to a `char` array, then use a `for` loop to traverse from back to front (`for (int i = s.length() - 1; i >= 0; i--)`), append characters to a new array or `StringBuilder`, then convert back to String. I described the second approach in the interview.

> **Q9: What's the difference between ArrayList and LinkedList?**
> **Me:**
> - **Underlying structure:** `ArrayList` uses a dynamic array; `LinkedList` uses a doubly linked list.
> - **Query performance:** `ArrayList` has O(1) query due to contiguous memory and index support; `LinkedList` requires traversing pointers, making queries O(n).
> - **Add/Remove performance:** `ArrayList` may involve array expansion and element copying, performing poorly; `LinkedList` only needs to change pointer references of adjacent nodes, highly efficient for additions/removals, especially at head/tail.

> **Q10: How to iterate through an ArrayList?**
> **Me:** Three common methods:
> 1. Regular `for` loop using `array.size()` for bounds and `array.get(i)` to retrieve elements.
> 2. Enhanced `for-each` loop (internally uses iterators).
> 3. Using `Iterator` for traversal.

> **Q11: If an array has duplicate data, how to remove duplicates?**
> **Me:** Can directly put array elements into `HashSet`, leveraging Set's automatic deduplication.

> **Q12: If putting custom objects into HashSet, how to ensure correct deduplication logic?**
> **Me:** Need to **override the `equals()` method** in the custom entity class.
>
> [!TIP]
> You must also override the `hashCode()` method, because HashSet relies on hash values to locate buckets. If hash values differ, objects will be stored in different locations even if `equals()` returns true.

---

## 4. Microservices Framework

> **Q13: Have you used Dubbo? What's the difference between Dubbo and Spring Cloud for microservice registration and consumption?**
> **Me:** I've only learned that Dubbo is a high-performance RPC framework, similar to Spring Cloud, both used for microservice registration and consumption. However, my daily development primarily uses the Spring Cloud ecosystem (Spring Boot + Spring Cloud), and I'm not familiar with specific Dubbo usage details.

---

## 5. Questions for Interviewer

> **Me:** Do you have any feedback or suggestions for my interview performance today?
> **Interviewer:** No suggestions, everything was quite good.

---

## Interview Summary

This interview difficulty was moderate, a fairly standard first round. Key areas examined:

1. **Authenticity of project experience:** Interviewer was very interested in how the code sandbox runs via Docker and the underlying interactions, requiring clear understanding of core project flows.
2. **Daily development fundamentals:** Including troubleshooting思路 for API errors - these have no standard answers but test accumulated coding experience.
3. **Java foundation solidity:** Collection class internals and object deduplication standards (overriding equals and hashCode) are must-know topics that should come naturally.

Overall, the conversation was pleasant. Looking forward to follow-up notification! Hope this helps others!
