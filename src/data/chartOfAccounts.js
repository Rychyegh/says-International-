export const SCHOOL_PL_ACCOUNTS = [
  { name: 'Admin fees', code: '10081' },
  { name: 'Application fees', code: '10082' },
  { name: 'Athletic fees', code: '10083' },
  { name: 'Basic Aid', code: '10084' },
  { name: 'Boarding House Fee', code: '10085' },
  { name: 'Bus', code: '10086' },
  { name: 'Canteen fees', code: '10087' },
  { name: 'Card services', code: '10088' },
  { name: 'Class activities income', code: '10089' },
  { name: 'Computer user fee', code: '10090' },
  { name: 'Computer User Fess', code: '10091' },
  { name: 'Dalex Finance Investments', code: '10092' },
  { name: 'Diesel', code: '10093' },
  { name: 'Discount type #1', code: '10094' },
  { name: 'Discount type #2', code: '10095' },
  { name: 'Discount type #3', code: '10096' },
  { name: 'Donor Assistance', code: '10097' },
  { name: 'DSJ (PSAS) Aid', code: '10098' },
  { name: 'Endowments income #1', code: '10099' },
  { name: 'Extended care fees', code: '10100' },
  { name: 'Extended care fees assistance', code: '10101' },
  { name: 'Feeding fees', code: '10102' },
  { name: 'Field trip income', code: '10103' },
  { name: 'Fundraising income #1', code: '10104' },
  { name: 'Fundraising income #2', code: '10105' },
  { name: 'Gifts & Donations - Non restricted', code: '10106' },
  { name: 'GNAPS Dues', code: '10107' },
  { name: 'Graduation fee', code: '10108' },
  { name: 'Grants', code: '10109' },
  { name: 'Interest Income', code: '10110' },
  { name: 'Investment expenses', code: '10111' },
  { name: 'Investment Income', code: '10112' },
  { name: 'Maintenance fee', code: '10113' },
  { name: 'Misc. Income', code: '10114' },
  { name: 'Motivation fee', code: '10115' },
  { name: 'Other Assistance', code: '10116' },
  { name: 'Other fees', code: '10117' },
  { name: 'Other Income & Expenses', code: '10118' },
  { name: 'Other students activities income', code: '10119' },
  { name: 'Other tuition related income', code: '10120' },
  { name: 'Parish Assistance', code: '10121' },
  { name: 'Pre-school tuition', code: '10122' },
  { name: 'Pre-school tuition assistance', code: '10123' },
  { name: 'PTA', code: '10124' },
  { name: 'Registration fees', code: '10125' },
  { name: 'Release from Restrictions', code: '10126' },
  { name: 'Rental Income', code: '10127' },
  { name: 'Robotics', code: '10128' },
  { name: 'Scholarship #1', code: '10129' },
  { name: 'Scholarship #2', code: '10130' },
  { name: 'School Assistance', code: '10131' },
  { name: 'School Fees Arrears', code: '10132' },
  { name: 'Science camp income', code: '10133' },
  { name: 'Science Kits', code: '10134' },
  { name: 'Stationary fees', code: '10135' },
  { name: 'Suspense - Transaction category tbd', code: '10136' },
  { name: 'Tech fees', code: '10137' },
  { name: 'Toiletries', code: '10138' },
  { name: 'Tuition type #1', code: '10139' },
  { name: 'Tuition type #2', code: '10140' },
  { name: 'UCMAS', code: '10141' },
  { name: 'Uniform sales', code: '10142' },
  { name: 'Electricity & Utility Expenses Account', code: '10901' },
  { name: 'Canteen & Feeding Operations Account', code: '10902' },
  { name: 'Office Supplies & Stationery Account', code: '10903' },
  { name: 'Transport & Vehicle Maintenance Account', code: '10904' },
  { name: 'General Operating Expenses', code: '10905' },
  { name: 'Tuition & Academic Fees', code: '10012' },
  { name: 'Bus & Transport Services', code: '10025' },
  { name: 'Stationery & Depot Revenue', code: '10040' },
  { name: 'Utility & Generator Expenses', code: '50010' },
  { name: 'Staff Salaries Account', code: '50022' },
  { name: 'Accounts Receivable - Sundry Students', code: '11001' },
  { name: 'Accounts Receivable - External Commercial Clients', code: '11002' },
  { name: 'Accounts Receivable - Canteen & Feeding Services', code: '11003' },
  { name: 'Accounts Receivable - Transport & Bus Logistics', code: '11004' },
  { name: 'Canteen / Feeding Account', code: '10906' },
  { name: 'Sundry Revenue Account', code: '10907' },
  { name: 'Bookshop & Sales Account', code: '10908' },
  { name: 'Transport Revenue Account', code: '10909' },
  { name: 'Facility Rental & Misc', code: '10910' },
  { name: 'Facility & ICT Account', code: '10911' },
  { name: 'PTA Development Levy', code: '10912' },
  { name: 'Transport Account', code: '10913' },
];

export const BANK_RECEIVING_ACCOUNTS = [
  { name: 'GCB Bank Main Operating Account (55919200085584)', code: '10001', category: 'Bank / Operating' },
  { name: 'Ecobank Fee Collection Account (14410029402)', code: '10002', category: 'Bank / Collection' },
  { name: 'MTN Mobile Money Merchant Vault (0244000111)', code: '10003', category: 'Mobile Money / Vault' },
  { name: 'Amenfiman Rural Bank Account (7719200011)', code: '10004', category: 'Bank / Rural' },
  { name: 'Cash Office Main Safe Account', code: '10005', category: 'Cash Office / Vault' },
];

export const PHOTO_RECEIVING_ACCOUNTS = SCHOOL_PL_ACCOUNTS.slice(0, 62);

export const ALL_RECEIVING_ACCOUNTS = [
  ...BANK_RECEIVING_ACCOUNTS,
  ...PHOTO_RECEIVING_ACCOUNTS.map((a) => ({
    name: a.name,
    code: a.code,
    category: 'SIMS Revenue / Fee Account',
  })),
];

export const PL_ACCOUNT_NAMES = SCHOOL_PL_ACCOUNTS.map((a) => a.name);

const ACCOUNT_CODE_BY_NAME = [...SCHOOL_PL_ACCOUNTS, ...BANK_RECEIVING_ACCOUNTS].reduce((acc, item) => {
  acc[item.name] = item.code;
  return acc;
}, {});

export function getPlAccountCode(name) {
  return ACCOUNT_CODE_BY_NAME[name] || '';
}

export function printPvPage() {
  document.body.classList.add('print-pv');
  const restore = () => {
    document.body.classList.remove('print-pv');
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
  setTimeout(restore, 1200);
}
