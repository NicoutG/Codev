.PHONY: help build up down restart logs clean init

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker-compose build --no-cache

up: ## Start all services
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 10
	@docker exec polytech_backend python init_db.py || true

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs
	docker-compose logs -f

clean: ## Stop and remove everything (including volumes)
	docker-compose down -v
	docker system prune -f

init: ## Initialize database
	docker exec polytech_backend python init_db.py

ps: ## Show running containers
	docker-compose ps

shell-backend: ## Access backend shell
	docker exec -it polytech_backend bash

shell-db: ## Access PostgreSQL shell
	docker exec -it polytech_postgres psql -U postgres -d polytech_stats
