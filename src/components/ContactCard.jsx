import React, { useState } from 'react';
import { getContactName, getContactPhone, getContactSubtitle, truncateName, makeContactKey } from '../utils/sheetData';
import { isFavorited, toggleFavorite } from '../utils/favorites';
import { recordRecent } from '../utils/recent';

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

// Single contact card, shared by the per-sheet grid, the homepage's
// Favorites/Recently Contacted strips, and global search results - so
// favoriting, sharing, and the vCard save logic only live in one place.
export default function ContactCard({ contact, sheetName, onFavoriteChange }) {
  const rawName = getContactName(contact);
  const contactPhone = getContactPhone(contact);
  const subTitle = getContactSubtitle(contact);
  const displayedName = truncateName(rawName);
  const contactKey = makeContactKey(sheetName, contact);

  const [favorited, setFavorited] = useState(() => isFavorited(contactKey));

  const track = () => recordRecent({ key: contactKey, sheetName, contact });

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite({ key: contactKey, sheetName, contact });
    setFavorited(prev => !prev);
    onFavoriteChange?.();
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (!canShare) return;
    track();
    try {
      await navigator.share({
        title: rawName.toString(),
        text: [rawName, subTitle, contactPhone].filter(Boolean).join(' — '),
      });
    } catch {
      // User cancelled the share sheet, or the browser rejected it - nothing to do.
    }
  };

  const handleSaveContact = () => {
    if (!contactPhone) return;
    track();

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${rawName}`,
      `TEL;TYPE=CELL:${contactPhone}`,
      `TITLE:${subTitle}`,
      `NOTE:Saved from CityOne Skyve Contacts (${sheetName})`,
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeFileName = `${rawName.toString().replace(/[^a-zA-Z0-9]/g, '_')}_Contact.vcf`;

    link.href = url;
    link.setAttribute('download', safeFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card hover-card h-100 shadow-sm rounded-3 d-flex flex-column justify-content-between bg-white overflow-hidden position-relative">

      {/* FAVORITE + SHARE, top-right corner */}
      <div className="position-absolute d-flex gap-1" style={{ top: '8px', right: '8px', zIndex: 3 }}>
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="tap-target-expand btn btn-sm p-0 border-0 bg-transparent d-flex align-items-center justify-content-center"
          style={{ width: '26px', height: '26px', fontSize: '1rem' }}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <i className={`bi ${favorited ? 'bi-star-fill text-warning' : 'bi-star text-secondary'}`}></i>
        </button>
        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            className="tap-target-expand btn btn-sm p-0 border-0 bg-transparent d-flex align-items-center justify-content-center"
            style={{ width: '26px', height: '26px', fontSize: '1rem' }}
            title="Share this contact"
            aria-label="Share this contact"
          >
            <i className="bi bi-share-fill text-secondary"></i>
          </button>
        )}
      </div>

      {/* TOP PANEL: AVATAR & METADATA INFOBAR */}
      <div className="p-3 d-flex align-items-start gap-3 flex-grow-1">

        {/* AVATAR WRAPPER CONTAINER FRAME */}
        <div className="position-relative flex-shrink-0" style={{ width: '50px', height: '50px' }}>

          {/* Monogram Initials Circle Base */}
          <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm h-100 w-100"
               style={{ fontSize: '1.125rem' }}>
            {rawName.toString().charAt(0).toUpperCase()}
          </div>

          {/* ABSOLUTE OVERLAID WHATSAPP ACTION BUTTON BADGE */}
          {contactPhone && (
            <a
              href={`https://wa.me/${contactPhone.toString().replace(/[^0-9]/g, '')}`}
              className="tap-target-expand position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center border border-2 border-white shadow"
              style={{
                width: '26px',
                height: '26px',
                fontSize: '0.8125rem',
                zIndex: '2'
              }}
              title={`Chat with ${rawName} on WhatsApp`}
              onClick={(e) => { e.stopPropagation(); track(); }} // Bypasses accidental container execution captures
            >
              <i className="bi bi-whatsapp"></i>
            </a>
          )}
        </div>

        {/* Meta Fields Content Stack */}
        <div className="min-w-0 flex-grow-1 pe-4">
          <h3 className="h6 contact-name text-truncate text-dark mb-0 fw-bold" title={rawName.toString()}>
            {displayedName}
          </h3>
          {subTitle && (
            <small className="contact-subtitle text-muted text-truncate d-block mb-2">
              {subTitle.toString()}
            </small>
          )}

          <div className="d-flex flex-wrap gap-1 align-items-center">
            {Object.entries(contact).map(([key, val]) => {
              if (['name', 'phone', 'mobile', 'designation', 'role'].includes(key.toLowerCase()) || !val) return null;
              return (
                <span key={key} className="badge bg-light text-secondary border px-2 py-1 rounded font-monospace" style={{ fontSize: '0.625rem' }}>
                  <strong className="text-dark">{key}:</strong> {val.toString()}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: FULL-WIDTH ACTION TABS */}
      {contactPhone ? (
        <div className="d-flex border-top bg-light">
          {/* CALL ACTION BUTTON */}
          <a
            href={`tel:${contactPhone}`}
            className="contact-action-btn btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 border-end d-flex align-items-center justify-content-center gap-2 fw-semibold text-success"
            style={{ fontSize: '0.8125rem' }}
            onClick={track}
          >
            <i className="bi bi-telephone-fill"></i> Call
          </a>

          {/* SAVE ACTION BUTTON */}
          <button
            onClick={handleSaveContact}
            className="contact-action-btn btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-semibold text-primary"
            style={{ fontSize: '0.8125rem' }}
          >
            <i className="bi bi-person-plus-fill"></i> Save Contact
          </button>
        </div>
      ) : (
        <div className="border-top bg-light p-2 text-center small text-muted font-monospace">
          No contact details provided
        </div>
      )}

    </div>
  );
}
