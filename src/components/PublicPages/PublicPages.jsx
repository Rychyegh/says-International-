import React from 'react';
import { BookOpen, Building2, CalendarDays, HeartHandshake, Landmark, Users } from 'lucide-react';
import './PublicPages.css';

const PAGES = {
  'About Us': { icon: Landmark, title: 'About REMALJ Carewell', intro: 'A learner-centred school community in Bogoso, helping every child grow in character, confidence, and academic excellence.', sections: [['Our story', 'REMALJ Carewell Inspirational School combines strong teaching, purposeful pastoral care, and a welcoming community.'], ['Our values', 'Excellence, integrity, service, and respect guide the way we learn and work together.']] },
  Academics: { icon: BookOpen, title: 'Academics', intro: 'Clear learning pathways from foundational years through senior high school.', sections: [['Teaching & learning', 'Subject specialists use projects, assessments, and feedback to help learners make steady progress.'], ['Results & reports', 'Students can access published results and families can request semester reports through the portal.']] },
  Admissions: { icon: Users, title: 'Admissions', intro: 'Begin your child’s REMALJ Carewell journey with a straightforward admissions process.', sections: [['How to apply', 'Complete an enquiry, submit the required records, and attend an age-appropriate placement conversation.'], ['Support', 'Our admissions team can help families understand entry requirements, fees, and start dates.']] },
  'Our Campuses': { icon: Building2, title: 'Our campuses', intro: 'Safe, purposeful spaces designed for learning, play, discovery, and community.', sections: [['Bogoso campus', 'Our Bogoso campus brings classrooms, practical learning spaces, sports, and student support together.'], ['Transport', 'The portal’s transport page provides route status and live bus tracking for participating families.']] },
  Community: { icon: HeartHandshake, title: 'Community', intro: 'Families, educators, students, and support teams working together for every learner.', sections: [['Parent partnership', 'Parents can contact teachers, submit concerns, request reports, and stay connected with school updates.'], ['Student life', 'Leadership, clubs, arts, sport, and service help students build confidence beyond the classroom.']] },
  'News & Events': { icon: CalendarDays, title: 'News & events', intro: 'Important dates, celebrations, and the moments that bring our school together.', sections: [['Coming up', 'Sports & Culture Day · October 24. Parent-Teacher Conference · November 2. End of Term Exams · November 20.'], ['School notices', 'Log in to a portal to receive personalised timetable, result, transport, and communication updates.']] },
};

export default function PublicPages({ page }) {
  const content = PAGES[page];
  if (!content) return null;
  const Icon = content.icon;
  return <main className="public-page"><div className="public-page__hero"><span className="public-page__icon"><Icon size={28}/></span><div><h1>{content.title}</h1><p>{content.intro}</p></div></div><div className="public-page__sections">{content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div></main>;
}
