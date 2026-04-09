import React, { useState, useEffect } from 'react';
import { MapPin, Phone } from 'lucide-react';
import './BusTracker.css';

const ROUTES = [
  { id: 'A', name: 'Bus 01 – Route A', color: '#2563eb', stops: ['School Gate', 'Accra Mall', 'East Legon', 'Adenta'], students: 22, capacity: 25, speed: '38 km/h', driver: 'Daniel Appiah', driverRole: 'Bus Supervisor', nextStop: 'East Legon Gate', eta: '15:45', progress: 62, status: 'On Route' },
  { id: 'B', name: 'Bus 02 – Route B', color: '#dc2626', stops: ['School Gate', 'Airport Res.', 'Roman Ridge', 'Cantonments'], students: 18, capacity: 25, speed: '42 km/h', driver: 'Kweku Mensah', driverRole: 'Driver', nextStop: 'Roman Ridge', eta: '16:05', progress: 40, status: 'On Route' },
  { id: 'C', name: 'Bus 03 – Route C', color: '#d97706', stops: ['School Gate', 'Tema Station', 'Spintex', 'Sakumono'], students: 14, capacity: 25, speed: '0 km/h', driver: 'Ama Konadu', driverRole: 'Driver', nextStop: 'School Gate', eta: '–',     progress: 0,  status: 'At School' },
  { id: 'D', name: 'Bus 04 – Route D', color: '#16a34a', stops: ['School Gate', 'Green Valley', 'Kumasi Rd', 'Pakyi'], students: 20, capacity: 25, speed: '45 km/h', driver: 'Kofi Acheampong', driverRole: 'Bus Supervisor', nextStop: 'Green Valley', eta: '16:15', progress: 30, status: 'On Route' },
];

const MANIFEST = {
  A: [
    { name: 'Abena Mensa',  stop: 'Boarded at East Legon',        on: true  },
    { name: 'Kofi Mensah',  stop: 'Boarded at Airport Residential',on: true  },
    { name: 'Yaa Boateng',  stop: 'Boarded at Roman Ridge',       on: true  },
    { name: 'Kwame Adu',    stop: 'Boarded at East Legon',         on: true  },
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

/* SVG fake map paths per route */
const MAP_PATHS = {
  A: 'M 60 400  Q 150 300 250 250  Q 350 200 420 150  Q 480 120 550 80',
  B: 'M 60 400  Q 100 380 180 350  Q 280 300 350 260  Q 430 220 520 180',
  C: 'M 60 400  Q 80 380 100 360',
  D: 'M 60 400  Q 160 360 260 300  Q 360 250 450 200  Q 520 160 580 130',
};

const BUS_POS = { A: [65,12], B: [50,28], C: [10,85], D: [38,40] };

export default function BusTracker({ mode = 'teacher' }) {
  const [selectedRoute, setSelectedRoute] = useState('A');
  const [busPos, setBusPos] = useState(0);

  const route = ROUTES.find(r => r.id === selectedRoute);
  const students = MANIFEST[selectedRoute] || [];

  // Animate bus position along progress
  useEffect(() => {
    const t = setTimeout(() => setBusPos(route.progress), 300);
    return () => clearTimeout(t);
  }, [selectedRoute, route.progress]);

  const trackPct = `${busPos}%`;
  const trackLeft = `calc(${busPos}% - 7px)`;

  return (
    <div className="bus-tracker">
      {/* Left: Map + popup */}
      <div className="bus-map-panel">
        {/* SVG road map */}
        <svg className="bus-map-svg" viewBox="0 0 700 450" preserveAspectRatio="xMidYMid slice">
          {/* Road background paths */}
          {ROUTES.map(r => (
            <path
              key={r.id}
              d={MAP_PATHS[r.id]}
              fill="none"
              stroke={r.id === selectedRoute ? r.color : 'rgba(0,0,0,0.12)'}
              strokeWidth={r.id === selectedRoute ? 5 : 3}
              strokeLinecap="round"
              strokeDasharray={r.id === selectedRoute ? 'none' : '8 6'}
              style={{ filter: r.id === selectedRoute ? `drop-shadow(0 0 4px ${r.color}66)` : 'none' }}
            />
          ))}

          {/* Stop circles */}
          {route.stops.map((stop, i) => {
            const t = i / (route.stops.length - 1);
            // Approx positions along path A
            const positions = [
              [60, 400], [180, 310], [330, 220], [480, 140], [550, 85]
            ];
            const p = positions[Math.min(i, positions.length - 1)];
            const isPast = (i / route.stops.length) * 100 < busPos;
            return (
              <g key={stop}>
                <circle cx={p[0]} cy={p[1]} r="8" fill={isPast ? route.color : '#fff'} stroke={route.color} strokeWidth="2.5" />
                <text x={p[0]} y={p[1] - 14} textAnchor="middle" fontSize="10" fill="#374151" fontWeight="600">{stop}</text>
              </g>
            );
          })}

          {/* Animated bus icon */}
          <g className="bus-marker" style={{ transform: `translate(${BUS_POS[selectedRoute][0]}px, ${BUS_POS[selectedRoute][1]}px)` }}>
            <circle cx="0" cy="0" r="16" fill={route.color} opacity=".2" />
            <circle cx="0" cy="0" r="11" fill={route.color} />
            <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#fff">🚌</text>
          </g>

          {/* School marker */}
          <g>
            <circle cx="60" cy="400" r="12" fill="#204d2d" />
            <text x="60" y="404" textAnchor="middle" fontSize="11" fill="#fff">🏫</text>
            <text x="60" y="420" textAnchor="middle" fontSize="9" fill="#374151" fontWeight="700">ICS Ghana</text>
          </g>
        </svg>

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
          <button className="bus-popup__live-btn">
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
          <button className="map-ctrl-btn">+</button>
          <button className="map-ctrl-btn">−</button>
          <button className="map-ctrl-btn" title="My location">◎</button>
        </div>
      </div>

      {/* Right: Manifest + Driver + (teacher: route list) */}
      <div className="bus-side-panel">
        {/* Route selector (teacher only) */}
        {mode === 'teacher' && (
          <div className="panel" style={{ padding: '14px' }}>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#374151', marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>All Routes</div>
            <div className="route-list">
              {ROUTES.map(r => (
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
            {ROUTES.slice(0, 2).map(r => (
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
