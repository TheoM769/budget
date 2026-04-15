.PHONY: api tui dev install

# --- Install ---

install: ## Install all dependencies
	cd frontend/tui && npm install
	uv sync

# --- Run individually ---

api: ## Start the FastAPI backend
	uv run fastapi dev src/budget/api/app.py

tui: ## Start the TUI (one-shot)
	cd frontend/tui && npm start

# --- Dev mode ---

dev: ## Start API + TUI in watch mode (parallel)
	@echo "Starting API and TUI in parallel... (Ctrl+C to stop both)"
	@trap 'kill 0' EXIT; \
		$(MAKE) api & \
		sleep 1 && cd frontend/tui && npm run dev

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
