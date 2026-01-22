# 🚀 GenLayer Setup Guide for Mac (Complete Beginner)

## What We're Building

An **AI-Verified Task Completion App** - a smart contract that uses AI to verify if tasks have been completed. Think of it like a bounty system where AI judges whether work meets the requirements.

---

## Part 1: Install Required Software

### Step 1.1: Open Terminal

1. Press `Cmd + Space` to open Spotlight
2. Type "Terminal" and press Enter
3. A black/white window will open - this is where you'll type commands

### Step 1.2: Install Homebrew (Mac Package Manager)

Copy and paste this entire command into Terminal, then press Enter:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- When asked for your password, type it (you won't see characters - that's normal)
- Wait 2-5 minutes for installation
- **Important**: Follow any instructions shown at the end to add Homebrew to your PATH

### Step 1.3: Install Node.js

```bash
brew install node
```

Verify it worked:
```bash
node --version
```
You should see something like `v20.x.x`

### Step 1.4: Install Python

```bash
brew install python
```

Verify:
```bash
python3 --version
```
You should see `Python 3.x.x`

### Step 1.5: Install Docker Desktop

1. Go to: https://www.docker.com/products/docker-desktop/
2. Click "Download for Mac" (choose Apple Chip or Intel based on your Mac)
3. Open the downloaded `.dmg` file
4. Drag Docker to Applications
5. Open Docker from Applications
6. Wait for it to start (whale icon in menu bar)

Verify Docker is running:
```bash
docker --version
```

---

## Part 2: Set Up GenLayer

### Step 2.1: Install GenLayer CLI

```bash
npm install -g genlayer
```

### Step 2.2: Initialize GenLayer

```bash
genlayer init
```

During setup, you'll be asked:
1. **Choose LLM Provider**: Select "OpenAI" (easiest for beginners)
2. **Enter API Key**: 
   - Go to https://platform.openai.com/api-keys
   - Create an account if needed
   - Click "Create new secret key"
   - Copy and paste the key

### Step 2.3: Start GenLayer

```bash
genlayer up
```

Wait for it to start (1-2 minutes). You'll see logs scrolling.

### Step 2.4: Open GenLayer Studio

Open your browser and go to:
```
http://localhost:8080
```

🎉 You should see the GenLayer Studio interface!

---

## Part 3: Create Your Project

### Step 3.1: Create Project Folder

```bash
mkdir ~/genlayer-task-verifier
cd ~/genlayer-task-verifier
mkdir contracts
```

### Step 3.2: Create the Smart Contract

Create a new file called `task_verifier.py` in the `contracts` folder:

```bash
touch contracts/task_verifier.py
```

Open it in a text editor (you can use TextEdit, VS Code, or any editor):
```bash
open -a TextEdit contracts/task_verifier.py
```

Copy the entire contract code from `task_verifier.py` (provided separately) into this file.

---

## Part 4: Deploy Your Contract

### Option A: Using GenLayer Studio (Visual - Recommended for Beginners)

1. Open http://localhost:8080 in your browser
2. Click "Contracts" in the sidebar
3. Click "Upload Contract"
4. Select your `task_verifier.py` file
5. Click "Deploy"
6. Note the contract address that appears

### Option B: Using Command Line

```bash
genlayer deploy --contract contracts/task_verifier.py
```

Copy the contract address from the output.

---

## Part 5: Test Your Contract

### In GenLayer Studio:

1. Click on your deployed contract
2. You'll see all available functions

### Create a Test Task:

1. Find `create_task` function
2. Fill in:
   - **title**: "Test Documentation Task"
   - **description**: "Create a README file for a project"
   - **verification_criteria**: "README must include project name, description, and installation instructions"
   - **reward_amount**: 100
3. Click "Execute"

### Claim the Task:

1. Find `claim_task` function
2. Enter the task_id: `0`
3. Click "Execute"

### Submit Proof:

1. Find `submit_proof` function
2. Enter:
   - **task_id**: `0`
   - **proof_url**: `https://github.com/genlayerlabs/genlayer-studio` (a real GitHub repo for testing)
3. Click "Execute"

### Verify Completion:

1. Find `verify_completion` function
2. Enter **task_id**: `0`
3. Click "Execute"
4. Watch the AI verification happen! 🤖

---

## Part 6: Understanding What Happened

When you called `verify_completion`:

1. **Multiple AI validators** received your request
2. Each validator **fetched the proof URL** independently
3. Each validator's **LLM analyzed** if the evidence met criteria
4. Validators **voted** on the result
5. **Consensus** was reached (majority wins)
6. The **result was recorded** on-chain

This is the magic of GenLayer - **decentralized AI verification**!

---

## Troubleshooting

### "Command not found: genlayer"
```bash
# Refresh your terminal
source ~/.zshrc
# Or restart Terminal completely
```

### "Docker is not running"
1. Open Docker Desktop from Applications
2. Wait for the whale icon to stop animating
3. Try `genlayer up` again

### "Cannot connect to localhost:8080"
```bash
# Stop and restart GenLayer
genlayer down
genlayer up
```

### "OpenAI API error"
- Check your API key is correct
- Ensure you have credits in your OpenAI account
- Try: `genlayer init` again to re-enter the key

---

## Next Steps

1. ✅ You've built your first Intelligent Contract!
2. 📖 Read the documentation: https://docs.genlayer.com
3. 🏆 Submit to Builder Program: https://points.genlayer.foundation
4. 🧪 Deploy to Testnet Asimov
5. 🎨 Build a frontend with React + genlayer-js

---

## Quick Reference Commands

| Command | What it does |
|---------|--------------|
| `genlayer init` | Set up LLM providers |
| `genlayer up` | Start local environment |
| `genlayer down` | Stop local environment |
| `genlayer deploy --contract FILE` | Deploy a contract |
| `genlayer --help` | Show all commands |

---

**Congratulations!** 🎉 You've built an AI-powered smart contract that can verify real-world task completion. This is cutting-edge blockchain + AI technology!
