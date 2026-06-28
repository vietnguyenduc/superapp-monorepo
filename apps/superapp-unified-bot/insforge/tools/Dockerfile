FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    asyncpg==0.29.0 \
    httpx==0.25.2 \
    tiktoken==0.5.2 \
    pydantic==2.5.2

COPY deepwiki_server.py /app/

EXPOSE 7131

CMD ["uvicorn", "deepwiki_server:app", "--host", "0.0.0.0", "--port", "7131"]
