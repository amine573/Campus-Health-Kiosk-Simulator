/**
 * Converts an array of objects to a CSV string
 */
const toCSV = (rows) => {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
  };
  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(','));
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Flatten an audit log entry for CSV export
 */
const flattenAuditEntry = (entry) => ({
  auditId: entry._id?.toString() || '',
  eventType: entry.eventType || '',
  actorRole: entry.actorRole || '',
  actorName: entry.actor?.name || '',
  actorCampusId: entry.actor?.campusId || '',
  targetObjectType: entry.targetObjectType || '',
  targetObjectId: entry.targetObjectId || '',
  eventTimestamp: entry.eventTimestamp
    ? new Date(entry.eventTimestamp).toISOString()
    : '',
  eventOutcome: entry.eventOutcome || '',
  details: entry.details || '',
});

module.exports = { toCSV, flattenAuditEntry };
