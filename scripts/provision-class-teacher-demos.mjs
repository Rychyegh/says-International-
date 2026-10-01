/**
 * Create class-teacher demo logins on the live REMALJ backend.
 *
 * Usage:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/provision-class-teacher-demos.mjs
 */
const BASE = process.env.VITE_API_BASE_URL || 'https://rcis-backend.onrender.com/api/v1';

const DEMOS = [
  {
    fullName: 'Ms. Efua Boateng',
    email: 'classteacher@remaljcarewell.edu.gh',
    password: 'ClassTeacher2026!',
    passcode: '2468',
    staffId: 'CT-2026-DEMO',
    classLevel: 'Basic 1',
    phone: '0249002200',
    department: 'Class Tutors',
  },
  {
    fullName: 'Mrs. Abena Sarfo',
    email: 'a.sarfo@remaljcarewell.edu.gh',
    password: 'ClassTeacher2026!',
    passcode: '1357',
    staffId: 'STF-2026-004',
    classLevel: 'Basic 2',
    phone: '0249001104',
    department: 'English Language',
  },
];

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { detail: text }; }
  if (!res.ok) {
    const detail = data.detail ? JSON.stringify(data.detail) : text;
    throw new Error(`${method} ${path} -> ${res.status} ${detail}`);
  }
  return data;
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD to a live Head Admin account.');
  }

  const login = await request('/auth/login', {
    method: 'POST',
    body: { email, password, portal: 'admin' },
  });
  const token = login.token;
  if (!token) throw new Error('Admin login did not return a token.');

  for (const demo of DEMOS) {
    try {
      await request('/users', {
        method: 'POST',
        token,
        body: {
          email: demo.email,
          username: demo.email.split('@')[0],
          password: demo.password,
          full_name: demo.fullName,
          name: demo.fullName,
          role: 'teacher',
          phone: demo.phone,
          phone_number: demo.phone,
          designation: 'class_teacher',
          class_assigned: demo.classLevel,
          assigned_class: demo.classLevel,
          department: demo.department,
          is_active: true,
          status: 'Active',
        },
      });
      console.log(`user created: ${demo.email}`);
    } catch (err) {
      console.log(`user ${demo.email}: ${err.message}`);
    }

    try {
      await request('/auth/class-teachers', {
        method: 'POST',
        token,
        body: {
          teacher_name: demo.fullName,
          class_assigned: demo.classLevel,
          staff_id: demo.staffId,
          passcode: demo.passcode,
          phone: demo.phone,
          send_sms: false,
        },
      });
      console.log(`passcode issued: ${demo.staffId} / ${demo.passcode}`);
    } catch (err) {
      console.log(`passcode ${demo.staffId}: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
