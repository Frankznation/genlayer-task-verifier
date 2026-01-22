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
# GenLayer Task Verifier

An AI-Verified Task Completion System built on GenLayer's Intelligent Contracts.

## Description

This project demonstrates GenLayer's Intelligent Contracts by building a task/bounty verification system where AI validators reach consensus on whether work has been completed.

## Installation Instructions

### Prerequisites
- Node.js 18+
- Docker 26+
- GenLayer CLI

### Setup

1. Install GenLayer CLI:
```bash
npm install -g genlayer
```

2. Initialize GenLayer:
```bash
genlayer init
```

3. Start the environment:
```bash
genlayer up
```

4. Deploy the contract:
```bash
genlayer deploy --contract contracts/task_verifier.py
```

## Features

- Create tasks with verification criteria
- Submit proof URLs for AI verification
- Decentralized AI consensus using multiple validators
- Automatic task status updates

## Built With

- GenLayer Intelligent Contracts
- Python
- Optimistic Democracy Consensus"
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
