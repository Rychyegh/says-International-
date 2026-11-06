import React from 'react';
import { ArrowUpRight, ArrowRight, BookOpen, Users, GraduationCap, ShieldCheck, Wallet, MapPin, Phone, Mail } from 'lucide-react';
import './SchoolHome.css';

const portals = [
  { key:'student', title:'Students', description:'Your learning. Your next chapter.', icon:GraduationCap },
  { key:'parent', title:'Parents', description:'Stay connected to their journey.', icon:Users },
  { key:'teacher', title:'Teachers', description:'Inspire, assess and guide.', icon:BookOpen },
  { key:'admin', title:'Administration', description:'Bring the school day together.', icon:ShieldCheck },
  { key:'accountant', title:'Accounts', description:'Manage school fees and payments.', icon:Wallet },
];

export default function SchoolHome() {
  return <div className="school-home">
    <div className="school-home-ribbon"><span>BOGOSO, GHANA</span><span>A community of learning. A world of possibility.</span></div>
    <header className="school-home-header">
      <a className="school-home-brand" href="/#/" aria-label="REMALJ Carewell home"><img src="/remalj-carewell-logo.png" alt="" width="60" height="60"/><span><strong>REMALJ CAREWELL</strong><small>INSPIRATIONAL SCHOOL</small></span></a>
      <nav aria-label="Homepage navigation"><a href="#school-contact" onClick={event=>{event.preventDefault();document.getElementById('school-contact')?.scrollIntoView({behavior:'smooth'});}}>Contact us</a><a className="school-home-nav-cta" href="#school-portals" onClick={event=>{event.preventDefault();document.getElementById('school-portals')?.scrollIntoView({behavior:'smooth'});}}>Enter your portal <ArrowUpRight size={17}/></a></nav>
    </header>
    <main>
      <div className="school-home-workspace">
        <section className="school-home-welcome" aria-labelledby="school-home-title">
          <div className="school-home-welcome-mark"><img src="/remalj-carewell-logo.png" alt="REMALJ Carewell school crest"/></div>
          <p className="school-home-eyebrow">REMALJ CAREWELL INSPIRATIONAL SCHOOL</p>
          <h1 id="school-home-title">Your school.<br/><em>A world of possibilities.</em></h1>
          <p className="school-home-lead">A little curiosity. A lot of possibility.<br/>Welcome to a community where every child belongs.</p>
          <div className="school-home-welcome-bottom"><span><MapPin size={14}/> Bogoso, Ghana</span></div>
        </section>
        <section className="school-home-portals" id="school-portals" aria-labelledby="school-portals-title">
          <div className="school-home-section-heading"><p className="school-home-eyebrow">SCHOOL PORTALS</p><h2 id="school-portals-title">Make yourself <em>at home.</em></h2><p>Choose your portal. Your school day starts here.</p></div>
          <nav className="school-home-portal-grid" aria-label="School portals">{portals.map(({key,title,description,icon:Icon})=><a className={`school-home-portal school-home-portal-${key}`} key={key} href={`/#/${key}`}><span className="school-home-portal-icon"><Icon size={24} strokeWidth={1.7}/></span><div className="school-home-portal-copy"><h3>{title}</h3><p>{description}</p></div><span className="school-home-portal-arrow">Enter portal <ArrowUpRight size={16}/></span></a>)}</nav>
          <div className="school-home-help"><ShieldCheck size={18}/><p>Secure access for our school community.<br/><span>Use the account provided by your school.</span></p></div>
          <a className="school-home-assistance" href="tel:+233535400080">Need help signing in? <span>Contact the school <ArrowRight size={14}/></span></a>
        </section>
      </div>
      <section className="school-home-contact" id="school-contact" aria-labelledby="school-contact-title"><div><p className="school-home-eyebrow">LET’S START A CONVERSATION</p><h2 id="school-contact-title">A warm welcome<br/> <em>awaits you.</em></h2><p>Have a question? We’re here to help.</p></div><div className="school-home-contact-details"><a href="tel:+233535400080"><Phone size={21}/><span><small>GIVE US A CALL</small>053 540 0080</span><ArrowUpRight size={20}/></a><a href="mailto:info@remaljschools.com"><Mail size={21}/><span><small>WRITE TO US</small>info@remaljschools.com</span><ArrowUpRight size={20}/></a><div><MapPin size={21}/><span><small>FIND OUR SCHOOL</small>Opposite Shining Star Hotel, Anikoko, Bogoso.<br/><span className="school-home-postal">Prestea Huni-Valley Municipality · P. O. Box 139</span></span></div></div></section>
    </main><footer className="school-home-footer"><strong>REMALJ CAREWELL</strong><span>Inspiring Excellence</span><small>© {new Date().getFullYear()} REMALJ Carewell Inspirational School</small></footer>
  </div>;
}
