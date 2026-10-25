import React from 'react';

export default function SchoolHome() {
  return <main style={{maxWidth:960,margin:'40px auto',padding:32,background:'#fff',borderRadius:16,color:'#123b4a'}}>
    <img src="/remalj-carewell-logo.png" alt="REMALJ Carewell Inspirational School logo" width="110" height="110" />
    <h1>REMALJ Carewell Inspirational School</h1>
    <h2>Welcome to our school in Bogoso, Ghana</h2>
    <p>Find school contact information and access the secure portals for our school community.</p>
    <h2>Visit or contact us</h2>
    <p>Opposite Shining Star Hotel, Anikoko, Bogoso, Prestea Huni-Valley Municipality.</p>
    <p>P. O. Box 139, Bogoso.</p>
    <p>Telephone: <a href="tel:+233535400080">0535400080</a></p>
    <p>Email: <a href="mailto:info@remaljschools.com">info@remaljschools.com</a></p>
    <h2>School portals</h2>
    <nav aria-label="School portals" style={{display:'flex',gap:16,flexWrap:'wrap'}}>
      {[['admin','Administration'],['teacher','Teachers'],['parent','Parents'],['student','Students'],['accountant','Accounts']].map(([portal,label])=><a key={portal} href={`/#/${portal}`} style={{padding:12,border:'1px solid #cbd5e1',borderRadius:8}}>{label}</a>)}
    </nav>
    <p>Portal access requires an authorized school account.</p>
  </main>;
}
