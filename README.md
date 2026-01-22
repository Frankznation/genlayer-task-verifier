# 🤖 AI-Verified Task Completion System

> A GenLayer Intelligent Contract that uses decentralized AI consensus to verify real-world task completion

[![GenLayer](https://img.shields.io/badge/Built%20on-GenLayer-00d9ff)](https://genlayer.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌟 Overview

This project demonstrates the power of GenLayer's Intelligent Contracts by building a task/bounty verification system. Unlike traditional smart contracts that can only verify on-chain data, this contract uses AI to assess whether real-world work has been completed.

### Key Features

- ✅ **AI-Powered Verification**: Multiple AI validators analyze proof of task completion
- 🗳️ **Decentralized Consensus**: 5 validators using different LLMs vote on outcomes  
- 🌐 **Real-World Integration**: Fetches and analyzes web content (GitHub, websites, docs)
- 🔒 **Secure by Design**: Multi-model diversity protects against prompt injection

## 📁 Project Structure

```
genlayer-task-verifier/
├── contracts/
│   └── task_verifier.py      # Main Intelligent Contract
├── tests/
│   └── test_task_verifier.py # Test suite
├── docs/
│   └── ARCHITECTURE_DIAGRAM.html
├── SETUP_GUIDE.md            # Complete beginner guide
├── TUTORIAL_BLOG_POST.md     # Technical deep-dive
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker 26+
- OpenAI API key (or other LLM provider)

### Installation

```bash
# Install GenLayer CLI
npm install -g genlayer

# Initialize GenLayer
genlayer init

# Start local environment
genlayer up

# Deploy the contract
genlayer deploy --contract contracts/task_verifier.py
```

### Basic Usage

```python
# 1. Create a task
create_task(
    title="Write Documentation",
    description="Create API docs for the REST endpoints",
    verification_criteria="Docs must include all endpoints, request/response examples, and auth section",
    reward_amount=100
)

# 2. Worker claims the task
claim_task(task_id=0)

# 3. Worker submits proof
submit_proof(
    task_id=0,
    proof_url="https://github.com/user/docs-repo"
)

# 4. AI verification
verify_completion(task_id=0)
# Returns: "VERIFIED: Documentation includes all required sections..."
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER LAYER                              │
│   Task Creator → Worker → Frontend DApp (genlayer-js)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 INTELLIGENT CONTRACT                         │
│   create_task() → claim_task() → submit_proof()             │
│                        │                                     │
│                        ▼                                     │
│              verify_completion()                             │
│    ┌──────────────────────────────────────────┐             │
│    │ 1. gl.get_webpage() - fetch evidence      │             │
│    │ 2. gl.exec_prompt() - AI analysis         │             │
│    │ 3. eq_principle - reach consensus         │             │
│    └──────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              OPTIMISTIC DEMOCRACY CONSENSUS                  │
│                                                              │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │
│   │GPT-4│  │Claude│  │Llama│  │ Qwen│  │GPT-4│             │
│   │  ✓  │  │  ✓  │  │  ✓  │  │  ✓  │  │  ✗  │             │
│   └─────┘  └─────┘  └─────┘  └─────┘  └─────┘             │
│                                                              │
│              4/5 validators agree → VERIFIED                 │
└─────────────────────────────────────────────────────────────┘
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Complete beginner setup for Mac |
| [TUTORIAL_BLOG_POST.md](TUTORIAL_BLOG_POST.md) | Technical deep-dive tutorial |
| [ARCHITECTURE_DIAGRAM.html](docs/ARCHITECTURE_DIAGRAM.html) | Interactive visual diagram |

## 🧪 Testing

```bash
# Run tests with GenLayer test framework
gltest tests/test_task_verifier.py
```

## 🔧 Contract API

### Write Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `create_task` | title, description, criteria, reward | Create new task |
| `claim_task` | task_id | Claim open task |
| `submit_proof` | task_id, proof_url | Submit completion proof |
| `verify_completion` | task_id | Trigger AI verification |

### View Functions

| Function | Parameters | Returns |
|----------|------------|---------|
| `get_task` | task_id | Full task details |
| `get_task_status` | task_id | Current status |
| `get_tasks_by_creator` | address | Task IDs by creator |
| `get_tasks_by_worker` | address | Task IDs by worker |
| `get_total_tasks` | - | Total task count |

## 🎯 Use Cases

- **Freelance Platforms**: Verify deliverables before payment
- **Bug Bounties**: Confirm security fixes
- **Grant Programs**: Validate milestone completion
- **Content Moderation**: Assess guideline compliance
- **Credential Verification**: Validate certifications

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🔗 Links

- [GenLayer Documentation](https://docs.genlayer.com)
- [GenLayer Studio](https://studio.genlayer.com)
- [Builder Program](https://points.genlayer.foundation)
- [GenLayer Discord](https://discord.gg/genlayer)

---

Built with ❤️ for the GenLayer Builder Program
