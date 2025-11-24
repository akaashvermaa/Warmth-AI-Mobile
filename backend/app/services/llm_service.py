# app/services/llm_service.py
import os
import logging
import time
import hashlib
import json
from datetime import datetime, date
from pathlib import Path
from openai import OpenAI
import tiktoken

from ..config import (
    ZAI_API_KEY,
    ZAI_BASE_URL,
    ZAI_MODEL,
    ZAI_TEMPERATURE,
    ZAI_TIMEOUT,
    MAX_INPUT_TOKENS,
    MAX_OUTPUT_TOKENS,
    DAILY_TOKEN_LIMIT,
    LLM_CACHE_TTL
)

logger = logging.getLogger(__name__)
llm_logger = logging.getLogger(f"{__name__}.llm")

# Usage tracking file
USAGE_FILE = Path(__file__).parent.parent / 'token_usage.json'


class LLMService:
    def __init__(self):
        if not ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=ZAI_API_KEY, base_url=ZAI_BASE_URL, timeout=ZAI_TIMEOUT)
        self.model = ZAI_MODEL  # Hardcoded to glm-4-flash
        self.encoder = tiktoken.encoding_for_model("gpt-3.5-turbo")  # Use GPT tokenizer as fallback
        self.cache = {}  # {hash: (response, timestamp)}
        
        logger.info(f"Z.ai LLM Service initialized with model: {self.model}")

    def is_available(self):
        """Check if Z.ai API is configured"""
        return bool(ZAI_API_KEY)

    def _count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken"""
        try:
            return len(self.encoder.encode(text))
        except Exception as e:
            logger.warning(f"Token counting failed, estimating: {e}")
            # Rough estimate: ~4 chars per token
            return len(text) // 4

    def _get_daily_usage(self) -> int:
        """Get today's token usage from file"""
        try:
            if not USAGE_FILE.exists():
                return 0
            
            with open(USAGE_FILE, 'r') as f:
                data = json.load(f)
            
            today = str(date.today())
            return data.get(today, 0)
        except Exception as e:
            logger.warning(f"Failed to read usage file: {e}")
            return 0

    def _increment_usage(self, tokens: int):
        """Add tokens to today's usage"""
        try:
            data = {}
            if USAGE_FILE.exists():
                with open(USAGE_FILE, 'r') as f:
                    data = json.load(f)
            
            today = str(date.today())
            data[today] = data.get(today, 0) + tokens
            
            # Keep only last 7 days
            cutoff = (datetime.now().date().toordinal() - 7)
            data = {k: v for k, v in data.items() if datetime.fromisoformat(k).toordinal() > cutoff}
            
            with open(USAGE_FILE, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            logger.error(f"Failed to update usage file: {e}")

    def _check_daily_limit(self):
        """Raise exception if daily limit is exceeded"""
        usage = self._get_daily_usage()
        if usage >= DAILY_TOKEN_LIMIT:
            raise Exception(f"Daily token limit exceeded: {usage}/{DAILY_TOKEN_LIMIT}")

    def _validate_input(self, messages: list[dict]) -> list[dict]:
        """Trim messages if they exceed MAX_INPUT_TOKENS"""
        # Count total tokens
        total_tokens = sum(self._count_tokens(m.get('content', '')) for m in messages)
        
        if total_tokens <= MAX_INPUT_TOKENS:
            return messages
        
        # Keep system message (first) and trim from oldest user messages
        system_msg = messages[0] if messages and messages[0].get('role') == 'system' else None
        other_msgs = messages[1:] if system_msg else messages
        
        # Reverse to keep most recent
        trimmed = []
        remaining_tokens = MAX_INPUT_TOKENS
        if system_msg:
            remaining_tokens -= self._count_tokens(system_msg.get('content', ''))
        
        for msg in reversed(other_msgs):
            msg_tokens = self._count_tokens(msg.get('content', ''))
            if remaining_tokens - msg_tokens < 0:
                break
            trimmed.insert(0, msg)
            remaining_tokens -= msg_tokens
        
        result = [system_msg] + trimmed if system_msg else trimmed
        logger.info(f"Trimmed input: {len(messages)} -> {len(result)} messages")
        return result

    def _get_cache_key(self, messages: list[dict]) -> str:
        """Generate cache key from messages"""
        # Create deterministic string from messages
        msg_str = json.dumps(messages, sort_keys=True)
        return hashlib.sha256(msg_str.encode()).hexdigest()

    def chat(self, messages: list[dict]) -> dict:
        """
        Non-streaming chat with caching and token monitoring.
        Returns dict compatible with old Ollama format: {"message": {"content": "..."}}
        """
        start_time = time.time()
        
        try:
            # 1. Check daily limit
            self._check_daily_limit()
            
            # 2. Validate and trim input
            messages = self._validate_input(messages)
            
            # 3. Check cache
            cache_key = self._get_cache_key(messages)
            if cache_key in self.cache:
                cached_response, cached_time = self.cache[cache_key]
                if time.time() - cached_time < LLM_CACHE_TTL:
                    llm_logger.info("Cache hit", extra={"model": self.model})
                    return cached_response
            
            # 4. Call Z.ai
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=MAX_OUTPUT_TOKENS,
                temperature=ZAI_TEMPERATURE
            )
            
            # 5. Log token usage
            tokens_used = response.usage.total_tokens
            self._increment_usage(tokens_used)
            
            elapsed = time.time() - start_time
            llm_logger.info(
                "Z.ai request",
                extra={
                    "model": self.model,
                    "tokens": tokens_used,
                    "response_time": round(elapsed, 2)
                }
            )
            
            # 6. Cache response (Ollama-compatible format)
            result = {
                "message": {
                    "content": response.choices[0].message.content
                }
            }
            self.cache[cache_key] = (result, time.time())
            
            return result
            
        except Exception as e:
            elapsed = time.time() - start_time
            llm_logger.error(
                "Z.ai error",
                extra={
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "model": self.model
                },
                exc_info=True
            )
            raise

    def chat_stream(self, messages: list[dict]):
        """
        Streaming chat response (no caching for streams).
        Yields tokens as they are generated.
        """
        start_time = time.time()
        
        try:
            # 1. Check daily limit
            self._check_daily_limit()
            
            # 2. Validate and trim input
            messages = self._validate_input(messages)
            
            llm_logger.info("Z.ai streaming started", extra={"model": self.model})
            
            # 3. Stream from Z.ai
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=MAX_OUTPUT_TOKENS,
                temperature=ZAI_TEMPERATURE,
                stream=True
            )
            
            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield token
            
            # 4. Log completion (estimate tokens since streaming doesn't provide usage)
            estimated_tokens = self._count_tokens(full_response) + sum(
                self._count_tokens(m.get('content', '')) for m in messages
            )
            self._increment_usage(estimated_tokens)
            
            elapsed = time.time() - start_time
            llm_logger.info(
                "Z.ai streaming completed",
                extra={
                    "model": self.model,
                    "estimated_tokens": estimated_tokens,
                    "response_time": round(elapsed, 2)
                }
            )
            
        except Exception as e:
            elapsed = time.time() - start_time
            llm_logger.error(
                "Z.ai streaming error",
                extra={
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "model": self.model
                },
                exc_info=True
            )
            raise
