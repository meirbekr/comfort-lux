.PHONY: venv install run build docker-run docker-stop clean

VENV ?= .venv
PORT ?= 8080

# Detect Windows vs Linux/macOS venv paths
ifeq ($(OS),Windows_NT)
	PYTHON = $(VENV)\Scripts\python.exe
	PIP = $(VENV)\Scripts\pip.exe
	UVICORN = $(VENV)\Scripts\uvicorn.exe
else
	PYTHON = $(VENV)/bin/python
	PIP = $(VENV)/bin/pip
	UVICORN = $(VENV)/bin/uvicorn
endif

$(VENV):
	python -m venv $(VENV)

venv: $(VENV)

install: $(VENV)
	$(PIP) install -r requirements.txt

run: install
	$(UVICORN) app.main:app --host 0.0.0.0 --port $(PORT) --reload

build:
	docker build -t comfort-lux .

docker-run:
	docker run -d -p $(PORT):8080 --name comfort-lux comfort-lux

docker-stop:
	docker stop comfort-lux || true
	docker rm comfort-lux || true

clean:
	rm -rf $(VENV) app/__pycache__ __pycache__
