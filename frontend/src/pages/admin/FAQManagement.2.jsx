  <td>
    <textarea
      value={editingFaq.answer}
      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
      className="edit-input"
      rows="3"
    />
  </td>
  <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <select
      value={editingFaq.isActive}
      onChange={(e) => setEditingFaq({ ...editingFaq, isActive: e.target.value === 'true' })}
      className="edit-input"
    >
      <option value="true">Active</option>
      <option value="false">Inactive</option>
    </select>
  </td>
  <td className="action-buttons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <button className="save-button" onClick={() => updateFaq(faq.id)}>
      <FaEdit /> Save
    </button>
    <button className="cancel-button" onClick={cancelEditing}>
      <FaTrash /> Cancel
    </button>
  </td>
</>
) : (
  <>
    <td>{faq.question}</td>
    <td>{faq.answer}</td>
    <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <span
        className="status-badge"
        style={{
          backgroundColor: faq.isActive ? '#28a745' : '#dc3545',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
      >
        {faq.isActive ? 'ACTIVE' : 'INACTIVE'}
      </span>
    </td>
    <td className="action-buttons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <button className="edit-button" onClick={() => startEditing(faq)}>
        <FaEdit /> Edit
      </button>
      <button className="delete-button" onClick={() => handleDeleteClick(faq)}>
        <FaTrash /> Delete
      </button>
    </td>
  </>
)} 