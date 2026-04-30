# Cortex Ecosystem: Agentic Coding + Graph Memory 🧠🚀

Welcome to the **Cortex Ecosystem**, a professional-grade suite for AI-assisted development and knowledge management. This workspace combines a terminal-based coding agent (**Cortex-CLI**) with a high-fidelity knowledge graph (**GraphMemory/MemoryOS**).

---

## 📂 Architecture

This repository is organized into two primary components that work in tandem:

### 1. [Cortex-CLI](./Cortex-CLI) (The Pilot)
A terminal-based AI coding agent that acts as your primary interface.
- **Agency**: Can read/write files and execute terminal commands.
- **Embedded Intelligence**: Has the native logic to query your GraphMemory without needing external services.
- **Multi-Model**: Supports OpenAI, Anthropic, Ollama, and vLLM.

### 2. [GraphMemory](./GraphMemory) (The Brain)
A sophisticated knowledge base that provides long-term semantic and structural context.
- **Hybrid Search**: Combines `pgvector` similarity search with recursive Knowledge Graph traversals.
- **MemoryOS**: Includes a web dashboard for visualizing your graph and managing note ingestion.
- **MCP Enabled**: Supports the Model Context Protocol for connecting to other AI assistants.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Docker** (to run the PostgreSQL + pgvector database)
- **PostgreSQL** (If not using Docker)
- **API Keys** (OpenAI or Anthropic) or a local provider like **Ollama**.

### 2. Initial Setup

1. **Start the Database**:
   ```bash
   cd GraphMemory
   docker-compose up -d
   ```

2. **Initialize MemoryOS (The Brain)**:
   ```bash
   cd frontend
   npm install
   npx prisma db push
   ```

3. **Initialize AI Service (The Ingester)**:
   This service handles entity extraction and graph indexing.
   ```bash
   cd GraphMemory/ai-service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Initialize Cortex-CLI (The Pilot)**:
   ```bash
   cd ../../Cortex-CLI/cli
   npm install
   npm run init-db
   ```

### 3. Global Installation (Optional)
To use Cortex-CLI from any directory on your system:
```bash
cd Cortex-CLI/cli
npm run build
npm link
```
Now you can simply run `cortex chat` anywhere!

### 4. Configuration

Run the automated configuration tool:
```bash
# Locally:
npm run dev configure
# Globally (after linking):
cortex configure
```
This tool saves your settings to both the local `.env` and a global config at `~/.cortex-cli/.env`.

### 5. Starting the Ecosystem
To bring the entire ecosystem online with one command:
```bash
cortex up
```
This will automatically start:
- **Docker** (PostgreSQL Database)
- **AI Service** (Python Indexer)
- **Dashboard** (Next.js Visualization)

---

## 💬 Usage

### Launching the Agent
To start a coding session with full memory access:
```bash
# Using the global command:
cortex chat

# Or resume a specific conversation:
cortex chat --conversation 1
```

### Key Commands in Chat
- **"What do you remember about...?"**: Triggers the `query_memory` tool to fetch data from the Knowledge Graph.
- **"Read file X" / "Create file Y"**: Allows the agent to manage your project files.
- **"Run command Z"**: Allows the agent to execute builds or tests.

---

## 🛠 Tech Stack Summary

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14, React Flow (Visualization), Tailwind CSS |
| **CLI** | Node.js (ESM), TypeScript, Commander, Inquirer |
| **AI/ML** | @xenova/transformers (Local Embeddings), OpenAI SDK |
| **Database** | PostgreSQL, pgvector, Drizzle ORM, Prisma |

---

## 📜 License
This entire ecosystem is licensed under the **MIT License**. Feel free to fork, modify, and contribute!
# Cortex-CLI
# Cortex-CLI
# COrtex-CLI
# Cortex-CLI
