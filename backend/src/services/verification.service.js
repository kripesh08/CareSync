const verificationRepo = require("../repositories/verification.repository");

/**
 * Upload document (Pharmacy / Hospital)
 */
const upload = async (user_id, data) => {
  return verificationRepo.uploadDocument({
    user_id,
    entity_type: data.entity_type,
    document_type: data.document_type,
    file_path: data.file_path,
  });
};

/**
 * Admin: list pending documents
 */
const listPending = async (entity_type) => {
  return verificationRepo.getPendingDocuments(entity_type);
};

/**
 * Admin: approve or reject document
 */
const reviewDocument = async (document_id, status) => {
  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw new Error("Invalid document status");
  }

  return verificationRepo.updateDocumentStatus(document_id, status);
};

/**
 * Check if REQUIRED document is approved (ENFORCEMENT)
 */
const hasApprovedLicense = async (user_id) => {
  const docs = await verificationRepo.getDocumentsByUser(
    user_id,
    "PHARMACY"
  );

  return docs.some(
    (doc) =>
      doc.document_type === "LICENSE" &&
      doc.status === "APPROVED"
  );
};

module.exports = {
  upload,
  listPending,
  reviewDocument,
  hasApprovedLicense,
};
