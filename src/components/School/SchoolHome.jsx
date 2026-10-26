import React from 'react';
import { ArrowUpRight, ArrowRight, BookOpen, Users, GraduationCap, ShieldCheck, Wallet, MapPin, Phone, Mail, Sparkles } from 'lucide-react';
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
      <section className="school-home-hero" aria-labelledby="school-home-title">
        <div className="school-home-intro"><p className="school-home-eyebrow"><span/> ROOTED IN CARE. INSPIRED TO GROW.</p><h1 id="school-home-title">Small beginnings.<br/> <em>Extraordinary</em><br/> possibilities.</h1><p className="school-home-lead">Welcome to REMALJ Carewell Inspirational School. A place for curious minds, meaningful connections and the next generation of possibilities.</p><a className="school-home-primary" href="#school-portals" onClick={event=>{event.preventDefault();document.getElementById('school-portals')?.scrollIntoView({behavior:'smooth'});}}>Find your school portal <ArrowRight size={20}/></a><div className="school-home-location"><MapPin size={16}/> Bogoso · Prestea Huni-Valley · Ghana</div></div>
        <div className="school-home-art" aria-label="REMALJ Carewell school identity"><div className="school-home-art-grid"/><span className="school-home-art-label">THE FUTURE STARTS HERE</span><div className="school-home-orbit"/><div className="school-home-crest"><img src="/remalj-carewell-logo.png" alt="REMALJ Carewell Inspirational School crest" width="240" height="240"/></div><span className="school-home-art-star"><Sparkles size={34}/></span><div className="school-home-art-caption"><span>LEARN WITH PURPOSE</span><p>Grow with confidence.</p><span className="school-home-art-number">01 / A BRIGHTER TOMORROW</span></div></div>
      </section>
      <section className="school-home-portals" id="school-portals" aria-labelledby="school-portals-title"><div className="school-home-section-heading"><div><p className="school-home-eyebrow">ONE SCHOOL. ONE CONNECTED COMMUNITY.</p><h2 id="school-portals-title">Your place to <em>connect.</em></h2></div><p>Choose your portal to get started.<br/>Secure access for our school community.</p></div><nav className="school-home-portal-grid" aria-label="School portals">{portals.map(({key,title,description,icon:Icon},index)=><a className="school-home-portal" key={key} href={`/#/${key}`}><div className="school-home-portal-top"><Icon size={25} strokeWidth={1.5}/><span>0{index+1}</span></div><h3>{title}</h3><p>{description}</p><span className="school-home-portal-link">Sign in <ArrowUpRight size={18}/></span></a>)}</nav><p className="school-home-secure"><ShieldCheck size={14}/> An authorized school account is required to access each portal.</p></section>
      <section className="school-home-contact" id="school-contact" aria-labelledby="school-contact-title"><div><p className="school-home-eyebrow">LET’S START A CONVERSATION</p><h2 id="school-contact-title">A warm welcome<br/> <em>awaits you.</em></h2><p>Have a question? We’re here to help.</p></div><div className="school-home-contact-details"><a href="tel:+233535400080"><Phone size={21}/><span><small>GIVE US A CALL</small>053 540 0080</span><ArrowUpRight size={20}/></a><a href="mailto:info@remaljschools.com"><Mail size={21}/><span><small>WRITE TO US</small>info@remaljschools.com</span><ArrowUpRight size={20}/></a><div><MapPin size={21}/><span><small>FIND OUR SCHOOL</small>Opposite Shining Star Hotel, Anikoko, Bogoso.<br/><span className="school-home-postal">Prestea Huni-Valley Municipality · P. O. Box 139</span></span></div></div></section>
    </main><footer className="school-home-footer"><strong>REMALJ CAREWELL</strong><span>Inspiring Excellence</span><small>© {new Date().getFullYear()} REMALJ Carewell Inspirational School</small></footer>
  </div>;
}
