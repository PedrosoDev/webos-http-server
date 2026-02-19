.PHONY: help build run stop logs clean restart push

# Variáveis
IMAGE_NAME=webos-http-server
CONTAINER_NAME=webos-server
PORT=3000

help: ## Mostrar esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Construir imagem Docker
	docker build -t $(IMAGE_NAME) .

run: ## Executar container
	docker run -d \
		--name $(CONTAINER_NAME) \
		--network host \
		-v webos-data:/app/data \
		--restart unless-stopped \
		$(IMAGE_NAME)

stop: ## Parar e remover container
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

restart: stop run ## Reiniciar container

logs: ## Ver logs do container
	docker logs -f $(CONTAINER_NAME)

exec: ## Abrir shell no container
	docker exec -it $(CONTAINER_NAME) sh

status: ## Ver status do container
	docker ps -a | grep $(CONTAINER_NAME) || echo "Container não encontrado"

clean: stop ## Limpar container e imagem
	docker rmi $(IMAGE_NAME) || true

clean-all: clean ## Limpar tudo incluindo volumes
	docker volume rm webos-data || true

compose-up: ## Iniciar com docker-compose
	docker-compose up -d

compose-down: ## Parar docker-compose
	docker-compose down

compose-logs: ## Ver logs do docker-compose
	docker-compose logs -f

dev: ## Rodar em modo desenvolvimento (local)
	npm run dev

test-build: ## Testar build localmente
	npm run build && npm start

push: ## Push para Docker Hub (configure IMAGE_NAME)
	docker push $(IMAGE_NAME)
