# 🥊 Challenge 01: The Mystery Exit & Ephemeral Proof

### Scenario
You are a DevOps engineer tasked with debugging container behavior and verifying data immutability.

---

### Task 1: The Disappearing Data
1. Run a container named `box-alpha` using the `alpine` image in interactive mode (or detached running a sleep loop: `sh -c "sleep 3600"`).
2. Inside `box-alpha`, create a file named `/secret.txt` containing the text `"docker-mastery-key-2026"`.
3. Stop and start `box-alpha`. Does `/secret.txt` still exist? Why?
4. Now remove `box-alpha` (`docker rm box-alpha`) and launch a completely new container named `box-beta` using the same `alpine` image.
5. Does `/secret.txt` exist in `box-beta`? Why or why not?

---

### Task 2: The Crash Investigator
Run this command on your terminal:
```bash
docker run -d --name mystery-box alpine ls /nonexistent-directory
```

Now answer:
1. Run `docker ps`. Why is `mystery-box` not listed in `docker ps`?
2. What command allows you to view `mystery-box`?
3. What is the exact **Exit Code** of `mystery-box`? (Use `docker inspect` or formatted `docker ps -a`).
4. What do the container logs reveal? (`docker logs mystery-box`).
5. Explain in your own words: **What determines when a container stops running?**

---

### 📤 How to Submit Your Solution:
Reply with your answers and the exact CLI commands you used for Task 1 and Task 2. Once validated, we will unlock Level 02: **Images, Layers & Union Filesystem Deep Dive**!
