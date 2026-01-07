const pool = require("../config/db");

/**
 * Upload verification document
 */
const uploadDocument = async (data) => {
  const query = `
    INSERT INTO verification_documents
      (user_id, entity_type, document_type, file_path)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    data.user_id,
    data.entity_type,
    data.document_type,
    data.file_path,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Get documents by user & entity
 */
const getDocumentsByUser = async (user_id, entity_type) => {
  const { rows } = await pool.query(
    `SELECT * FROM verification_documents 
     WHERE user_id = $1 AND entity_type = $2`,
    [user_id, entity_type]
  );
  return rows;
};

/**
 * Get pending documents (Admin)
 */
const getPendingDocuments = async (entity_type) => {
  const { rows } = await pool.query(
    `SELECT * FROM verification_documents 
     WHERE entity_type = $1 AND status = 'PENDING'`,
    [entity_type]
  );
  return rows;
};

/**
 * Update document status
 */
const updateDocumentStatus = async (document_id, status) => {
  const { rows } = await pool.query(
    `UPDATE verification_documents 
     SET status = $1 
     WHERE document_id = $2
     RETURNING *`,
    [status, document_id]
  );
  return rows[0];
};

module.exports = {
  uploadDocument,
  getDocumentsByUser,
  getPendingDocuments,
  updateDocumentStatus,
};
