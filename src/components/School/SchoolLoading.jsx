import React from 'react';
import { createPortal } from 'react-dom';
import './SchoolLoading.css';

export default function SchoolLoading({ error, onRetry }) {
  return createPortal(<div className="school-loading" role={error ? 'alert' : 'status'} aria-live="polite" aria-label={error ? 'Unable to open portal' : 'Loading school portal'}>
    <div className="school-loading__brand">
      <img src="/remalj-carewell-logo.png" alt="School crest" width="96" height="96"/>
      <h1>REMALJ</h1>
      <p>Carewell Inspirational School</p>
      <span className="school-loading__location">BOGOSO</span>
      {error ? <div className="school-loading__error"><p>{error}</p><button type="button" onClick={onRetry}>Try again</button></div> : <div className="school-loading__progress" aria-hidden="true"><span/></div>}
    </div>
  </div>, document.body);
}
