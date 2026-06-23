const pool = require('./pool')

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_filename VARCHAR(500) NOT NULL,
      upload_time TIMESTAMP DEFAULT NOW(),
      status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',
      CONSTRAINT valid_status CHECK (status IN ('UPLOADED','PROCESSING','AWAITING_REVIEW','REVIEWED','EXPORTED','FAILED'))
    );

    CREATE TABLE IF NOT EXISTS pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      image_path VARCHAR(1000) NOT NULL,
      page_number INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ocr_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      raw_text TEXT NOT NULL DEFAULT '',
      confidence FLOAT NOT NULL DEFAULT 0,
      words_json JSONB NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS corrections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_word VARCHAR(500) NOT NULL,
      corrected_word VARCHAR(500) NOT NULL,
      frequency INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, original_word)
    );

    CREATE TABLE IF NOT EXISTS export_files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      file_type VARCHAR(10) NOT NULL,
      file_path VARCHAR(1000) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    INSERT INTO users (id, username) VALUES ('user-1', 'Default User')
      ON CONFLICT (id) DO NOTHING;
  `)
  console.log('Database schema initialized')
}

module.exports = { initSchema }
