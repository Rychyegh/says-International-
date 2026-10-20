import React from 'react';
import { usePortalData } from '../../data/PortalStore';
import './BusTracker.css';

export default function BusTracker() {
  const { busRoutes = [] } = usePortalData() || {};
  return <section className="panel" aria-label="School transport">
    <div className="panel__header"><h2 className="panel__title">School transport</h2></div>
    <div className="panel__body">
      <p>Route details below come from saved school records. Live GPS tracking is not connected.</p>
      {!busRoutes.length ? <p role="status">No transport routes are available for this account.</p> : busRoutes.map(route => <article key={route.id}>
        <h3>{route.name || 'School route'}</h3>
        <p>Driver: {route.driverName || route.driver_name || 'Not supplied'}</p>
        <p>Stops: {Array.isArray(route.stops) ? route.stops.map(stop => typeof stop === 'string' ? stop : stop.name || '').filter(Boolean).join(' → ') || 'Not supplied' : 'Not supplied'}</p>
        <p>Status: {route.status || 'Not supplied'}</p>
      </article>)}
    </div>
  </section>;
}
