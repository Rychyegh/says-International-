import React, { useMemo, useState } from 'react';
import { BarChart3, BookOpenCheck, ClipboardCheck, FilePlus2, HeartPulse, PackageCheck, ShieldAlert, Wrench } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import './OperationsCentre.css';

const TABS = [
  { id: 'command', label: 'Command centre', icon: BarChart3 },
  { id: 'operations', label: 'Campus operations', icon: PackageCheck },
  { id: 'services', label: 'Service registers', icon: ClipboardCheck },
  { id: 'governance', label: 'Documentation & UAT', icon: BookOpenCheck },
];

const SERVICE_MODULES = ['Finance & fees', 'Human resources & payroll', 'Smart identity & pickup', 'Boarding management', 'Dining & nutrition', 'STEM, robotics & innovation', 'RCIS Studio & digital media', 'Transport & fleet', 'Library & digital learning', 'FACU health & welfare', 'Safeguarding & incident management', 'Clubs, sports, chapel & activities', 'Facilities, stores & assets'];

export default function OperationsCentre() {
  const [activeTab, setActiveTab] = useState('command');
  const { incidents, assetTasks, documentation, acceptanceChecks, serviceRecords = [], logIncident, addAssetTask, addDocumentationRecord, toggleAcceptanceCheck, addServiceRecord } = usePortalData();
  const [incident, setIncident] = useState({ category: 'Safeguarding', person: '', severity: 'Restricted' });
  const [asset, setAsset] = useState({ asset: '', task: '', owner: 'Facilities', due: '' });
  const [document, setDocument] = useState({ title: '', owner: 'ICT Administration' });
  const [service, setService] = useState({ module: SERVICE_MODULES[0], person: '', detail: '', status: 'Open' });
  const [notice, setNotice] = useState('');
  const completeChecks = useMemo(() => acceptanceChecks.filter((item) => item.done).length, [acceptanceChecks]);

  const submitIncident = (event) => { event.preventDefault(); if (!incident.person.trim()) return; logIncident(incident); setIncident({ category: 'Safeguarding', person: '', severity: 'Restricted' }); setNotice('Restricted case has been logged in the protected register.'); };
  const submitAsset = (event) => { event.preventDefault(); if (!asset.asset.trim() || !asset.task.trim()) return; addAssetTask(asset); setAsset({ asset: '', task: '', owner: 'Facilities', due: '' }); setNotice('Maintenance task has been added to the campus register.'); };
  const submitDocument = (event) => { event.preventDefault(); if (!document.title.trim()) return; addDocumentationRecord(document); setDocument({ title: '', owner: 'ICT Administration' }); setNotice('Documentation record has been added to the controlled register.'); };
  const submitService = (event) => { event.preventDefault(); if (!service.person.trim() || !service.detail.trim()) return; addServiceRecord(service); setService({ module: SERVICE_MODULES[0], person: '', detail: '', status: 'Open' }); setNotice('Service record saved to the institution-controlled register.'); };

  return <div className="operations-centre animate-fade-up">
    <div className="page-header">
      <p className="page-header__eyebrow"><span>Institutional control</span></p>
      <h1 className="page-header__title">Campus operations & governance</h1>
      <p className="page-header__subtitle">A working operational layer for the ToR: management oversight, restricted case logging, asset upkeep, controlled documentation and acceptance evidence.</p>
    </div>
    <div className="ops-tabs" role="tablist" aria-label="Campus operations sections">
      {TABS.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'ops-tab ops-tab--active' : 'ops-tab'} onClick={() => setActiveTab(id)}><Icon size={16}/>{label}</button>)}
    </div>
    {notice && <p className="ops-notice">✓ {notice}</p>}

    {activeTab === 'command' && <>
      <div className="stats-grid">
        <Metric icon="👩‍🎓" label="Active learners" value="612" hint="+18 this term" />
        <Metric icon="✓" label="Attendance today" value="94%" hint="574 present" />
        <Metric icon="🚌" label="Routes operating" value="3 / 4" hint="60 learners in transit" />
        <Metric icon="⚠" label="Restricted cases" value={String(incidents.filter((item) => item.status !== 'Closed').length)} hint="Authorised access only" warning />
      </div>
      <div className="ops-grid">
        <section className="panel"><div className="panel__header"><h2 className="panel__title">Management command centre</h2><span className="status-pill status-pill--success">Live register</span></div><div className="panel__body ops-kpis">
          <Kpi label="Admissions & enrolment" value="96%" detail="576 of 600 places confirmed" /><Kpi label="Academic progress" value="78%" detail="Term average across assessed subjects" /><Kpi label="Fees collection" value="GHS 184k" detail="92% of term target received" /><Kpi label="Facilities readiness" value="91%" detail="2 maintenance tasks in progress" />
        </div></section>
        <section className="panel"><div className="panel__header"><h2 className="panel__title">Operational coverage</h2></div><div className="panel__body ops-coverage">
          {['Student information & admissions', 'Academics & reporting', 'Transport & pickup control', 'Finance & fees', 'Boarding, dining & welfare', 'Library, STEM, studio & activities', 'Facilities, stores & assets', 'Health & safeguarding'].map((item) => <div key={item}><span>{item}</span><strong>Managed</strong></div>)}
        </div></section>
      </div>
      <section className="panel ops-roadmap"><div className="panel__header"><h2 className="panel__title">Implementation sequence</h2></div><div className="panel__body"><ol><li><strong>Foundation:</strong> identity, institution-owned data, admissions, academics and access controls.</li><li><strong>Campus operations:</strong> finance, transport, boarding/dining, HR, health and facilities.</li><li><strong>Future-ready learning:</strong> library, digital learning, STEM, studio and learner portfolios.</li><li><strong>Intelligence:</strong> executive dashboards, alerts, integration monitoring and performance optimisation.</li></ol></div></section>
    </>}

    {activeTab === 'operations' && <div className="ops-grid ops-grid--forms">
      <section className="panel"><div className="panel__header"><h2 className="panel__title"><ShieldAlert size={16}/> Health, welfare & safeguarding</h2><span className="status-pill status-pill--danger">Restricted</span></div><div className="panel__body"><p className="ops-intro">Record only the minimum information needed to route a case. Detailed case notes require the designated safeguarding workflow.</p><form className="ops-form" onSubmit={submitIncident}><label>Case type<select value={incident.category} onChange={(event) => setIncident({ ...incident, category: event.target.value })}><option>Safeguarding</option><option>Health & welfare</option><option>First aid</option><option>Pickup authorisation</option></select></label><label>Person / reference<input required value={incident.person} onChange={(event) => setIncident({ ...incident, person: event.target.value })} placeholder="Use approved learner or staff reference" /></label><label>Access classification<select value={incident.severity} onChange={(event) => setIncident({ ...incident, severity: event.target.value })}><option>Restricted</option><option>Confidential</option><option>Internal</option></select></label><button className="ops-primary" type="submit"><HeartPulse size={15}/> Log protected case</button></form></div><Register rows={incidents} fields={['category', 'person', 'severity', 'status']} /></section>
      <section className="panel"><div className="panel__header"><h2 className="panel__title"><Wrench size={16}/> Facilities, fleet & asset register</h2></div><div className="panel__body"><p className="ops-intro">Create trackable maintenance actions for buses, classrooms, laboratories, dining facilities and ICT assets.</p><form className="ops-form" onSubmit={submitAsset}><label>Asset or location<input required value={asset.asset} onChange={(event) => setAsset({ ...asset, asset: event.target.value })} placeholder="e.g. Science Lab 1" /></label><label>Required action<input required value={asset.task} onChange={(event) => setAsset({ ...asset, task: event.target.value })} placeholder="Describe the maintenance action" /></label><label>Owner<input value={asset.owner} onChange={(event) => setAsset({ ...asset, owner: event.target.value })} /></label><label>Due date<input type="date" value={asset.due} onChange={(event) => setAsset({ ...asset, due: event.target.value })} /></label><button className="ops-primary" type="submit"><PackageCheck size={15}/> Schedule task</button></form></div><Register rows={assetTasks} fields={['asset', 'task', 'owner', 'status']} /></section>
    </div>}

    {activeTab === 'services' && <div className="ops-grid ops-grid--forms"><section className="panel"><div className="panel__header"><h2 className="panel__title"><ClipboardCheck size={16}/> Campus service register</h2><span className="status-pill status-pill--info">{serviceRecords.length} records</span></div><div className="panel__body"><p className="ops-intro">Record operational actions for the non-academic modules required by the ToR. Each entry remains available to authorised staff in this local demonstration.</p><form className="ops-form" onSubmit={submitService}><label>Module<select value={service.module} onChange={(event) => setService({ ...service, module: event.target.value })}>{SERVICE_MODULES.map((module) => <option key={module}>{module}</option>)}</select></label><label>Learner, staff member or asset<input required value={service.person} onChange={(event) => setService({ ...service, person: event.target.value })} placeholder="Name or controlled reference" /></label><label>Action / record detail<input required value={service.detail} onChange={(event) => setService({ ...service, detail: event.target.value })} placeholder="e.g. Meal plan, card issue, library loan" /></label><label>Status<select value={service.status} onChange={(event) => setService({ ...service, status: event.target.value })}><option>Open</option><option>Approved</option><option>Completed</option><option>Follow-up</option></select></label><button className="ops-primary" type="submit"><ClipboardCheck size={15}/> Save service record</button></form></div><Register rows={serviceRecords} fields={['module', 'person', 'detail', 'status']} /></section><section className="panel"><div className="panel__header"><h2 className="panel__title">Included service controls</h2></div><div className="panel__body ops-coverage">{SERVICE_MODULES.map((module) => <div key={module}><span>{module}</span><strong>Register enabled</strong></div>)}</div></section></div>}

    {activeTab === 'governance' && <div className="ops-grid ops-grid--forms">
      <section className="panel"><div className="panel__header"><h2 className="panel__title"><FilePlus2 size={16}/> Controlled documentation register</h2><span className="status-pill status-pill--info">{documentation.length} records</span></div><div className="panel__body"><p className="ops-intro">Maintain the architecture, installation, administrator, user, data, backup, cybersecurity, hardware, software and integration records required before final acceptance.</p><form className="ops-form ops-form--compact" onSubmit={submitDocument}><label>Document title<input required value={document.title} onChange={(event) => setDocument({ ...document, title: event.target.value })} placeholder="e.g. Card-system operating manual" /></label><label>Document owner<input value={document.owner} onChange={(event) => setDocument({ ...document, owner: event.target.value })} /></label><button className="ops-primary" type="submit"><FilePlus2 size={15}/> Add record</button></form></div><Register rows={documentation} fields={['title', 'owner', 'status', 'updatedAt']} /></section>
      <section className="panel"><div className="panel__header"><h2 className="panel__title"><ClipboardCheck size={16}/> User acceptance & training</h2><span className="status-pill status-pill--warn">{completeChecks}/{acceptanceChecks.length} complete</span></div><div className="panel__body"><p className="ops-intro">Commissioning requires test evidence, role checks, recovery proof and practical training — installation alone is not acceptance.</p><div className="acceptance-list">{acceptanceChecks.map((item) => <label key={item.id} className={item.done ? 'acceptance-row acceptance-row--done' : 'acceptance-row'}><input type="checkbox" checked={item.done} onChange={() => toggleAcceptanceCheck(item.id)} /><span>{item.label}</span><strong>{item.done ? 'Evidenced' : 'Pending'}</strong></label>)}</div><div className="ops-training"><strong>Training audiences</strong><span>Directors · Management · System administrators · Teachers · Finance · Boarding/dining · Security · Transport · Library · Studio personnel</span></div></div></section>
    </div>}
  </div>;
}

function Metric({ icon, label, value, hint, warning }) { return <div className="stat-card"><div className="stat-card__icon" style={{ background: warning ? '#fee2e2' : '#e9f5ed', color: warning ? '#991b1b' : '#166534' }}>{icon}</div><div><div className="stat-card__value">{value}</div><div className="stat-card__label">{label}</div></div><div className={warning ? 'ops-warning' : 'ops-muted'}>{hint}</div></div>; }
function Kpi({ label, value, detail }) { return <div className="ops-kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Register({ rows, fields }) { return <div className="ops-register">{rows.slice(0, 5).map((row) => <div key={row.id} className="ops-register-row">{fields.map((field) => <span key={field} data-label={field}>{row[field] || '—'}</span>)}</div>)}</div>; }
