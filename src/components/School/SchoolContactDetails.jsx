import React from 'react';
import { SCHOOL_CONTACT as school } from '../../data/schoolContact';
export default function SchoolContactDetails() {
  return <span className="school-contact-details" style={{display:'block',fontSize:11,lineHeight:1.45,fontWeight:400,letterSpacing:'normal',textTransform:'none',marginTop:5,breakInside:'avoid'}}>
    <span style={{display:'block'}}>{school.postalAddress}</span>
    <span style={{display:'block'}}>Business Address: {school.businessAddress}</span>
    <span style={{display:'block'}}>{school.landmark}</span>
    <span style={{display:'block'}}>Official contact: {school.phone} · Email: {school.email}</span>
    <span style={{display:'block'}}>Website: {school.website}</span>
  </span>;
}
