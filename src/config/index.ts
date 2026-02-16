/**
 * Configuration file for Cabal platform
 */

export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  // AI Configuration
  ai: {
    // OpenAI or similar LLM provider
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    
    // RAG Configuration
    rag: {
      vectorDbPath: process.env.VECTOR_DB_PATH || './data/vectors',
      embeddingModel: process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
      topK: parseInt(process.env.RAG_TOP_K || '5'),
      similarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.7')
    },
    
    // LoRA Configuration
    lora: {
      modelsPath: process.env.LORA_MODELS_PATH || './models/lora',
      rank: parseInt(process.env.LORA_RANK || '8'),
      alpha: parseInt(process.env.LORA_ALPHA || '16')
    }
  },
  
  // Database (placeholder for future implementation)
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/cabal',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10')
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
