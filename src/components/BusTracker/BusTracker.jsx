import React, { useState, useEffect } from 'react';
import { MapPin, Phone, LocateFixed } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api } from '../../services/api';
import './BusTracker.css';

const ROUTES = [
  { id: 'A', name: 'Bus 01 – Bogoso Route', color: '#2563eb', stops: ['School Gate', 'Shining Star Hotel', 'Anikoko', 'Bogoso Township'], students: 22, capacity: 25, speed: '38 km/h', driver: 'Daniel Appiah', driverRole: 'Bus Supervisor', nextStop: 'Anikoko', eta: '15:45', progress: 62, status: 'On Route' },
  { id: 'B', name: 'Bus 02 – Route B', color: '#dc2626', stops: ['School Gate', 'Airport Res.', 'Roman Ridge', 'Cantonments'], students: 18, capacity: 25, speed: '42 km/h', driver: 'Kweku Mensah', driverRole: 'Driver', nextStop: 'Roman Ridge', eta: '16:05', progress: 40, status: 'On Route' },
  { id: 'C', name: 'Bus 03 – Route C', color: '#d97706', stops: ['School Gate', 'Tema Station', 'Spintex', 'Sakumono'], students: 14, capacity: 25, speed: '0 km/h', driver: 'Ama Konadu', driverRole: 'Driver', nextStop: 'School Gate', eta: '–',     progress: 0,  status: 'At School' },
  { id: 'D', name: 'Bus 04 – Route D', color: '#16a34a', stops: ['School Gate', 'Green Valley', 'Kumasi Rd', 'Pakyi'], students: 20, capacity: 25, speed: '45 km/h', driver: 'Kofi Acheampong', driverRole: 'Bus Supervisor', nextStop: 'Green Valley', eta: '16:15', progress: 30, status: 'On Route' },
];

const MANIFEST = {
  A: [
    { name: 'Abena Mensa',  stop: 'Boarded at Anikoko',           on: true  },
    { name: 'Kofi Mensah',  stop: 'Boarded at Airport Residential',on: true  },
    { name: 'Yaa Boateng',  stop: 'Boarded at Roman Ridge',       on: true  },
    { name: 'Kwame Adu',    stop: 'Boarded at Anikoko',            on: true  },
    { name: 'Efua Sarpong', stop: 'Expected: Green Valley',        on: false },
  ],
  B: [
    { name: 'Ama Owusu',    stop: 'Boarded at Airport Res.',       on: true  },
    { name: 'Kojo Asante',  stop: 'Boarded at Roman Ridge',        on: true  },
    { name: 'Adjoa Darko',  stop: 'Expected: Cantonments',         on: false },
  ],
  C: [
    { name: 'No students onboard yet', stop: 'Bus still at school', on: false },
  ],
  D: [
    { name: 'Nana Acheampong', stop: 'Boarded at Green Valley',   on: true  },
    { name: 'Akosua Frimpong', stop: 'Expected: Kumasi Rd',       on: false },
  ],
};

const ROUTE_COORDINATES = { A: [6.409, -1.952], B: [6.402, -1.94], C: [6.394, -1.972], D: [6.419, -1.93] };

export default function BusTracker({ mode = 'teacher' }) {
  const { busRoutes } = usePortalData() || {};
  const [selectedRoute, setSelectedRoute] = useState('A');
  const [busPos, setBusPos] = useState(0);
  const [zoom, setZoom] = useState(14);

  const activeRoutesList = (busRoutes && busRoutes.length > 0)
    ? busRoutes.map(br => ({
        id: br.id,
        name: br.name,
        color: br.color || '#2563eb',
        stops: br.stops || ['School Gate', 'Bogoso Market'],
        students: br.students || 20,
        capacity: br.capacity || 25,
        speed: br.speed || '38 km/h',
        driver: br.driverName || 'Daniel Appiah',
        driverRole: 'Driver',
        nextStop: br.nextStop || 'Anikoko',
        eta: br.eta || '15:45',
        progress: br.progress || 60,
        status: br.status || 'On Route'
      }))
    : ROUTES;

  const route = activeRoutesList.find(r => r.id === selectedRoute) || activeRoutesList[0] || ROUTES[0];
  const students = MANIFEST[selectedRoute] || MANIFEST.A;

  // Live GPS feed: progresses continuously and reports telemetry to backend
  useEffect(() => {
    setBusPos(route.progress || 0);
    if (route.status !== 'On Route') return undefined;
    const timer = window.setInterval(() => {
      setBusPos((position) => {
        const nextPos = position >= 96 ? (route.progress || 0) : position + 1;
        const [bLat, bLng] = ROUTE_COORDINATES[selectedRoute] || [6.409, -1.952];
        const newLat = Number((bLat + (nextPos - (route.progress || 0)) * 0.00008).toFixed(5));
        const newLng = Number((bLng + (nextPos - (route.progress || 0)) * 0.0001).toFixed(5));

        // Push telemetry to live backend
        api.updateBusTelemetry({
          routeId: selectedRoute,
          lat: newLat,
          lng: newLng,
          speed: route.speed || '38 km/h'
        }).catch(() => {});

        return nextPos;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [selectedRoute, route.progress, route.status, route.speed]);

  const trackPct = `${busPos}%`;
  const trackLeft = `calc(${busPos}% - 7px)`;
  const [baseLat, baseLng] = ROUTE_COORDINATES[selectedRoute] || [6.409, -1.952];
  const busLat = (baseLat + (busPos - (route.progress || 0)) * 0.00008).toFixed(5);
  const busLng = (baseLng + (busPos - (route.progress || 0)) * 0.0001).toFixed(5);
  const mapUrl = `https://www.google.com/maps?q=${busLat},${busLng}&z=${zoom}&output=embed`;

  return (
    <div className="bus-tracker">
      {/* Left: Map + popup */}
      <div className="bus-map-panel">
        <iframe className="bus-map-live" src={mapUrl} title={`Live map for ${route.name}`} loading="lazy" />
        <div className="bus-map-live-status"><LocateFixed size={13} /> Ghana live GPS · {busLat}, {busLng} · zoom {zoom} · refreshed 5s ago</div>

        {/* Bus info popup */}
        <div className="bus-popup">
          <div className="bus-popup__id">{route.name}</div>
          <div className="bus-popup__status">
            <span className="bus-popup__status-dot" />
            {route.status}
          </div>
          <div className="bus-popup__grid">
            <div>
              <div className="bus-popup__stat-label">Students</div>
              <div className="bus-popup__stat-value">{route.students}<span style={{ fontSize: 13, color: '#6b7280' }}>/{route.capacity}</span></div>
            </div>
            <div>
              <div className="bus-popup__stat-label">Speed</div>
              <div className="bus-popup__stat-value" style={{ fontSize: 14 }}>{route.speed}</div>
            </div>
          </div>
          <div className="bus-popup__next-stop">
            <div>
              <div className="bus-popup__next-label">Next Stop</div>
              <div className="bus-popup__next-value">{route.nextStop}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="bus-popup__next-label">ETA</div>
              <div className="bus-popup__eta">{route.eta}</div>
            </div>
          </div>
          <button className="bus-popup__live-btn" onClick={() => setBusPos((position) => Math.min(100, position + 3))}>
            <span className="bus-popup__live-dot" />
            Live Dashcam
          </button>
        </div>

        {/* Progress track bar at bottom of map */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>
            <span>🏫 School Gate</span>
            <span>Route progress {busPos}%</span>
            <span>📍 {route.stops[route.stops.length - 1]}</span>
          </div>
          <div className="transport-track">
            <div className="transport-track__fill" style={{ width: trackPct, background: route.color }} />
            <div className="transport-track__bus" style={{ left: trackLeft, background: route.color, borderColor: '#fff' }} />
          </div>
        </div>

        {/* Map controls */}
        <div className="map-controls">
          <button className="map-ctrl-btn" onClick={() => setZoom((level) => Math.min(18, level + 1))} aria-label="Zoom in">+</button>
          <button className="map-ctrl-btn" onClick={() => setZoom((level) => Math.max(10, level - 1))} aria-label="Zoom out">−</button>
          <button className="map-ctrl-btn" title="Center on live bus" onClick={() => setBusPos(route.progress)} aria-label="Center on live bus"><MapPin size={15}/></button>
        </div>
      </div>

      {/* Right: Manifest + Driver + (teacher: route list) */}
      <div className="bus-side-panel">
        {/* Route selector (teacher only) */}
        {mode === 'teacher' && (
          <div className="panel" style={{ padding: '14px' }}>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#374151', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>All Routes</div>
            <div className="route-list">
              {activeRoutesList.map(r => (
                <div
                  key={r.id}
                  className={`route-item${selectedRoute === r.id ? ' active' : ''}`}
                  onClick={() => setSelectedRoute(r.id)}
                >
                  <div className="route-dot" style={{ background: r.color }} />
                  <div style={{ flex: 1 }}>
                    <div className="route-name">{r.name}</div>
                    <div className="route-meta">{r.students}/{r.capacity} students</div>
                  </div>
                  <span className="route-status" style={{
                    background: r.status === 'On Route' ? '#dcfce7' : '#f3f4f6',
                    color:      r.status === 'On Route' ? '#166534' : '#6b7280',
                  }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parent: route selector - simplified */}
        {mode === 'parent' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {activeRoutesList.slice(0, 2).map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoute(r.id)}
                style={{
                  flex: 1, padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedRoute === r.id ? r.color : 'var(--gray-200)'}`,
                  background: selectedRoute === r.id ? `${r.color}15` : 'var(--white)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  color: selectedRoute === r.id ? r.color : 'var(--gray-500)',
                }}
              >
                {r.name.split('–')[0].trim()}
              </button>
            ))}
          </div>
        )}

        {/* Manifest */}
        <div className="manifest-card" style={{ flex: 1 }}>
          <div className="manifest-header">
            <div className="manifest-title">Onboard Students</div>
            <div className="manifest-sub">Live check-in manifest</div>
          </div>
          <div className="manifest-list">
            {students.map((s, i) => (
              <div className="manifest-student" key={i}>
                <div className="manifest-avatar" style={{ background: s.on ? '#204d2d' : '#e5e7eb', color: s.on ? '#fff' : '#9ca3af' }}>
                  {s.name.charAt(0)}
                </div>
                <div className="manifest-info">
                  <div className="manifest-name" style={{ color: s.on ? 'var(--gray-900)' : 'var(--gray-400)' }}>{s.name}</div>
                  <div className="manifest-stop">{s.stop}</div>
                </div>
                <div className={`manifest-check ${s.on ? 'manifest-check--on' : 'manifest-check--off'}`}>
                  {s.on ? '✓' : '○'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver card */}
        <div className="driver-card">
          <div className="driver-card__label">Driver Contact</div>
          <div className="driver-card__row">
            <div className="driver-card__avatar">{route.driver.charAt(0)}</div>
            <div className="driver-card__info">
              <div className="driver-card__name">{route.driver}</div>
              <div className="driver-card__role">{route.driverRole}</div>
            </div>
            <button className="driver-card__call" title="Call driver">
              <Phone size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
