import React from 'react';
import { createRoot } from 'react-dom/client';
import AccountingWorkspace from '../src/components/Finance/AccountingWorkspace';
import { setAuthToken, setAuthUser } from '../src/services/api';
const role=new URLSearchParams(location.search).get('role')||'head_admin';
setAuthToken('test-token');setAuthUser({id:'test-user',role});
createRoot(document.getElementById('root')).render(<AccountingWorkspace role={role}/>);
