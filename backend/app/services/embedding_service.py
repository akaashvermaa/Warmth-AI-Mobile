"""
Embedding Manager for vector search functionality.
Handles generation, storage, and retrieval of semantic embeddings using Z.ai API.
"""

import logging
import numpy as np
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingManager:
    """
    Manages semantic embeddings for memory items.
    Generates, caches, and computes similarity between text embeddings.
    """
    
    # Z.ai Embedding Model
    DEFAULT_MODEL = "embedding-3"
    EMBEDDING_DIM = 2048  # embedding-3 is 2048 dimensions
    
    def __init__(self, model_name: str = DEFAULT_MODEL):
        """
        Initialize the embedding manager with Z.ai API.
        """
        self.model_name = model_name
        self.client = None
        self.embedding_dim = self.EMBEDDING_DIM
        
        from ..config import ZAI_API_KEY, ZAI_BASE_URL
        
        if not ZAI_API_KEY:
            logger.error("ZAI_API_KEY not set. Embeddings will be disabled.")
            return
            
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=ZAI_API_KEY, base_url=ZAI_BASE_URL)
            logger.info(f"Z.ai Embedding Service initialized with model: {model_name}")
            
            # Test call to get dimensions (optional, but good for verification)
            # We skip it to avoid startup latency/cost, assuming 2048 for embedding-3
                
        except Exception as e:
            logger.error(f"Failed to initialize Z.ai client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if embedding service is available."""
        return self.client is not None
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text using Z.ai API.
        """
        if not self.is_available():
            return np.zeros(self.embedding_dim, dtype=np.float32)
        
        if not text or not isinstance(text, str):
            return np.zeros(self.embedding_dim, dtype=np.float32)
        
        try:
            # Truncate if too long (Z.ai limit is 8k, but let's be safe with 2k chars)
            if len(text) > 2000:
                text = text[:2000]
            
            response = self.client.embeddings.create(
                input=[text],
                model=self.model_name
            )
            embedding = response.data[0].embedding
            return np.array(embedding, dtype=np.float32)
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return np.zeros(self.embedding_dim, dtype=np.float32)
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts using Z.ai API.
        """
        if not self.is_available() or not texts:
            return [np.zeros(self.embedding_dim, dtype=np.float32) for _ in texts]
        
        try:
            # Filter and truncate
            processed_texts = []
            valid_indices = []
            
            for i, text in enumerate(texts):
                if text and isinstance(text, str):
                    processed_texts.append(text[:2000] if len(text) > 2000 else text)
                    valid_indices.append(i)
            
            if not processed_texts:
                return [np.zeros(self.embedding_dim, dtype=np.float32) for _ in texts]
            
            # Z.ai might have batch limits, let's do small batches
            batch_size = 10
            all_embeddings = []
            
            for i in range(0, len(processed_texts), batch_size):
                batch = processed_texts[i:i+batch_size]
                response = self.client.embeddings.create(
                    input=batch,
                    model=self.model_name
                )
                for item in response.data:
                    all_embeddings.append(np.array(item.embedding, dtype=np.float32))
            
            # Reconstruct result list
            results = [np.zeros(self.embedding_dim, dtype=np.float32) for _ in texts]
            for idx, emb in zip(valid_indices, all_embeddings):
                results[idx] = emb
                
            return results
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return [np.zeros(self.embedding_dim, dtype=np.float32) for _ in texts]
    
    @staticmethod
    def embedding_to_bytes(embedding: np.ndarray) -> bytes:
        """Convert numpy embedding array to bytes for database storage."""
        if embedding is None or len(embedding) == 0:
            return b''
        return embedding.astype(np.float32).tobytes()
    
    @staticmethod
    def bytes_to_embedding(data: bytes, dim: int = EMBEDDING_DIM) -> np.ndarray:
        """Convert bytes from database back to numpy array."""
        if not data:
            return np.zeros(dim, dtype=np.float32)
        try:
            return np.frombuffer(data, dtype=np.float32)
        except Exception as e:
            logger.error(f"Error converting bytes to embedding: {e}")
            return np.zeros(dim, dtype=np.float32)
    
    @staticmethod
    def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Compute cosine similarity between two embeddings."""
        if embedding1 is None or embedding2 is None or len(embedding1) == 0 or len(embedding2) == 0:
            return 0.0
        
        try:
            # Normalize vectors
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            # Compute cosine similarity
            similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
            return float(similarity)
        except Exception as e:
            logger.error(f"Error computing cosine similarity: {e}")
            return 0.0
    
    @staticmethod
    def batch_cosine_similarity(query_embedding: np.ndarray, embeddings: List[np.ndarray]) -> List[float]:
        """Compute cosine similarity between one query embedding and multiple embeddings."""
        if query_embedding is None or not embeddings:
            return []
        
        try:
            # Stack embeddings into a matrix
            embedding_matrix = np.array(embeddings, dtype=np.float32)
            
            # Normalize query
            query_norm = np.linalg.norm(query_embedding)
            if query_norm == 0:
                return [0.0] * len(embeddings)
            
            # Normalize each embedding
            norms = np.linalg.norm(embedding_matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1  # Avoid division by zero
            
            # Compute cosine similarities (vectorized)
            similarities = np.dot(embedding_matrix, query_embedding) / (norms.flatten() * query_norm)
            
            return [float(sim) for sim in similarities]
        except Exception as e:
            logger.error(f"Error computing batch cosine similarity: {e}")
            return [0.0] * len(embeddings)
