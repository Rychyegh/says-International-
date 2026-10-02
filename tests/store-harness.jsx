import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PortalDataProvider, usePortalData, studentsAreSamePerson } from '../src/data/PortalStore';
import { setAuthToken, setAuthUser } from '../src/services/api';
function Probe() {
  const data = usePortalData();
  useEffect(() => { window.testStore = data; }, [data]);
  return <p>Database integration test harness</p>;
}
let mountVersion = 0;
const root = createRoot(document.getElementById('root'));
window.mountStore = (role = 'accountant', enabled = true, userId = 'test-user') => {
  setAuthToken('eyJ-test-token');setAuthUser({id:userId,role});
  root.render(<PortalDataProvider key={`${role}-${enabled}-${++mountVersion}`} enabled={enabled}><Probe /></PortalDataProvider>);
};
window.mountStore('accountant', new URLSearchParams(location.search).has('enabled'));

window.studentsAreSamePerson = studentsAreSamePerson;
