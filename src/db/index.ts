// DEIVAKARAM DATABASE ADAPTER
// Combines real production Supabase client database queries and local storage Mock DB fallbacks.
import mockDb, { 
  Donation, Donor, Campaign, Volunteer, Beneficiary, 
  Event, ContactMessage, AuditLog, User, SystemNotification, Settings, GalleryItem,
  CelebrationBooking, DynamicPackage, DynamicAddon, NewsArticle
} from './mockDb';
import { supabase, isSupabaseConfigured } from './supabaseClient';

console.log(`[Deivakaram DB System]: Connected and running in ${isSupabaseConfigured ? 'Supabase LIVE' : 'Mock (Local Storage)'} mode.`);

// Helper function to create administrative audit logs in Supabase
const createAuditLog = async (action: string, module: string, recordId?: string, oldData?: any, newData?: any) => {
  if (!isSupabaseConfigured) return;
  try {
    const session = localStorage.getItem('deivakaram_active_user');
    const activeUser = session ? JSON.parse(session) : null;
    const isValidUUID = (id?: string) => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const userId = isValidUUID(activeUser?.id) ? activeUser.id : null;
    
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      module,
      record_id: recordId || null,
      old_data: oldData ? JSON.stringify(oldData) : null,
      new_data: newData ? JSON.stringify(newData) : null
    });
  } catch (err) {
    console.error('Audit logger failure:', err);
  }
};

// Helper function to create admin notifications in Supabase
const createNotification = async (title: string, message: string, type: 'donation' | 'volunteer' | 'case' | 'message' | 'alert') => {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('notifications').insert({
      title,
      message,
      type,
      read_status: false
    });
  } catch (err) {
    console.error('Notification creation failure:', err);
  }
};

// ----------------------------------------------------
// DATABASE CRUD ACTIONS IMPLEMENTATION
// ----------------------------------------------------

export const getDonations = async (): Promise<Donation[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*, donors(name, email)')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          donation_id: d.donation_id,
          donor_id: d.donor_id,
          campaign_id: d.campaign_id,
          amount: Number(d.amount),
          purpose: d.purpose,
          plan: d.plan,
          payment_method: d.payment_method,
          transaction_id: d.transaction_id,
          payment_status: d.payment_status,
          receipt_number: d.receipt_number,
          is_anonymous: d.is_anonymous,
          message: d.message,
          created_at: d.created_at,
          donor_name: d.donors?.name || 'Anonymous',
          donor_email: d.donors?.email || 'anonymous@deivakaram.org'
        }));
      }
    } catch (err) {
      console.warn('Supabase getDonations failed:', err);
    }
  }
  return mockDb.getDonations();
};

export const createDonation = async (data: Parameters<typeof mockDb.createDonation>[0]) => {
  if (isSupabaseConfigured) {
    let donorId = '';

    // If email is provided, verify/create the donor profile first
    if (data.email) {
      const { data: donor } = await supabase
        .from('donors')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      if (donor) {
        donorId = donor.id;
      } else {
        const { data: newDonor, error: de } = await supabase
          .from('donors')
          .insert({
            name: data.name || 'Anonymous Donor',
            email: data.email,
            phone: data.phone || null,
            address: data.address || null,
            pan: data.pan ? data.pan.toUpperCase() : null,
            donor_type: 'New Donor'
          })
          .select('id')
          .single();
        
        if (de) throw de;
        donorId = newDonor.id;
      }
    }

    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const donationId = `DVK-DON-${new Date().getFullYear()}-${seq}`;
    const receiptNumber = `DVK-REC-${seq}`;

    const basePayload: any = {
      donation_id: donationId,
      donor_id: donorId || null,
      campaign_id: data.campaign_id || null,
      amount: data.amount,
      purpose: data.purpose,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      payment_status: data.status,
      receipt_number: receiptNumber,
      is_anonymous: data.is_anonymous || false,
      message: data.plan ? `[${data.plan}] ${data.message || ''}`.trim() : (data.message || null)
    };

    let newDon: any = null;
    const resWithPlan = await supabase
      .from('donations')
      .insert({ ...basePayload, plan: data.plan || 'One-Time Contribution' })
      .select('*')
      .single();

    if (!resWithPlan.error && resWithPlan.data) {
      newDon = resWithPlan.data;
    } else {
      const resWithoutPlan = await supabase
        .from('donations')
        .insert(basePayload)
        .select('*')
        .single();
      
      if (resWithoutPlan.error) throw resWithoutPlan.error;
      newDon = resWithoutPlan.data;
    }

    // Trigger Side Effects (Audit logs & notifications)
    await createAuditLog('create', 'donations', newDon.id, null, newDon);
    await createNotification(
      `New Donation Received`,
      `${data.name || 'Anonymous'} contributed ₹${data.amount} for ${data.purpose}`,
      'donation'
    );

    // Increment raised amount on campaign if linked
    if (data.campaign_id && data.status === 'successful') {
      const { data: camp } = await supabase.from('campaigns').select('raised_amount').eq('id', data.campaign_id).single();
      if (camp) {
        const updatedRaised = Number(camp.raised_amount) + Number(data.amount);
        await supabase.from('campaigns').update({ raised_amount: updatedRaised }).eq('id', data.campaign_id);
      }
    }

    const donorObj: Donor = {
      id: donorId || `dn-${Date.now()}`,
      name: data.name || 'Anonymous Donor',
      email: data.email || 'donor@deivakaram.org',
      phone: data.phone,
      address: data.address,
      pan: data.pan ? data.pan.toUpperCase() : undefined,
      donor_type: 'New Donor',
      created_at: new Date().toISOString()
    };

    const finalDonation: Donation = {
      ...newDon,
      donor_name: data.name || 'Anonymous',
      donor_email: data.email || 'anonymous@deivakaram.org'
    };

    return {
      donation: finalDonation,
      donor: donorObj
    };
  }
  return mockDb.createDonation(data);
};

export const getDonors = async (): Promise<Donor[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getDonors failed:', e);
    }
  }
  return mockDb.getDonors();
};

export const createOrUpdateDonor = async (donorData: {
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  pan?: string;
  donor_type?: Donor['donor_type'];
}): Promise<Donor> => {
  if (isSupabaseConfigured) {
    try {
      const payload: any = {
        name: donorData.name,
        email: donorData.email,
        phone: donorData.phone || null,
        address: donorData.address || null,
        pan: donorData.pan ? donorData.pan.toUpperCase() : null,
        donor_type: donorData.donor_type || 'New Donor'
      };
      if (donorData.userId) {
        payload.user_id = donorData.userId;
      }

      // Check if donor already exists by email
      const { data: existing } = await supabase
        .from('donors')
        .select('*')
        .eq('email', donorData.email)
        .maybeSingle();

      if (existing) {
        const { data: updated, error: uErr } = await supabase
          .from('donors')
          .update(payload)
          .eq('id', existing.id)
          .select('*')
          .single();
        if (!uErr && updated) return updated;
      } else {
        const { data: created, error: cErr } = await supabase
          .from('donors')
          .insert(payload)
          .select('*')
          .single();
        if (!cErr && created) return created;
      }
    } catch (e) {
      console.warn('Supabase createOrUpdateDonor failed, using mockDb:', e);
    }
  }
  
  // Fallback to mockDb
  const existing = mockDb.getDonors().find(d => d.email.toLowerCase() === donorData.email.toLowerCase());
  if (existing) {
    existing.name = donorData.name;
    if (donorData.phone) existing.phone = donorData.phone;
    if (donorData.address) existing.address = donorData.address;
    if (donorData.pan) existing.pan = donorData.pan.toUpperCase();
    return existing;
  } else {
    const newD: Donor = {
      id: `dn-${Date.now()}`,
      user_id: donorData.userId || `usr-${Date.now()}`,
      name: donorData.name,
      email: donorData.email,
      phone: donorData.phone,
      address: donorData.address,
      pan: donorData.pan ? donorData.pan.toUpperCase() : undefined,
      donor_type: donorData.donor_type || 'New Donor',
      created_at: new Date().toISOString()
    };
    mockDb.getDonors().unshift(newD);
    return newD;
  }
};


export const getCampaigns = async (): Promise<Campaign[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getCampaigns failed:', e);
    }
  }
  return mockDb.getCampaigns();
};

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'raised_amount' | 'created_at'>) => {
  if (isSupabaseConfigured) {
    const { data: newCam, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        raised_amount: 0.00
      })
      .select('*')
      .single();
    
    if (error) throw error;
    await createAuditLog('create', 'campaigns', newCam.id, null, newCam);
    return newCam;
  }
  return mockDb.createCampaign(campaign);
};

export const updateCampaign = async (id: string, data: Partial<Campaign>) => {
  if (isSupabaseConfigured) {
    const { data: oldCam } = await supabase.from('campaigns').select('*').eq('id', id).single();
    const { data: newCam, error } = await supabase
      .from('campaigns')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    await createAuditLog('update', 'campaigns', id, oldCam, newCam);
    return newCam;
  }
  return mockDb.updateCampaign(id, data);
};

export const deleteCampaign = async (id: string) => {
  if (isSupabaseConfigured) {
    try {
      const { data: oldCam } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle();
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      if (oldCam) {
        await createAuditLog('delete', 'campaigns', id, oldCam, null);
      }
      mockDb.deleteCampaign(id);
      return true;
    } catch (e) {
      console.warn('Supabase deleteCampaign failed, falling back to mockDb:', e);
    }
  }
  return mockDb.deleteCampaign(id);
};

export const getVolunteers = async (): Promise<Volunteer[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getVolunteers failed:', e);
    }
  }
  return mockDb.getVolunteers();
};

export const registerVolunteer = async (data: Omit<Volunteer, 'id' | 'volunteer_id' | 'status' | 'created_at'>) => {
  if (isSupabaseConfigured) {
    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const volunteerId = `DVK-VOL-${seq}`;

    const { data: newVol, error } = await supabase
      .from('volunteers')
      .insert({
        volunteer_id: volunteerId,
        user_id: data.user_id || null,
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        location: data.location,
        occupation: data.occupation || null,
        skills: data.skills || [],
        interests: data.interests || [],
        availability: data.availability || null,
        experience: data.experience || null,
        emergency_contact: data.emergency_contact || null,
        status: 'submitted'
      })
      .select('*')
      .single();

    if (error) throw error;

    await createNotification(
      'New Volunteer Application',
      `${data.name} applied to volunteer with skills in ${data.skills?.join(', ') || 'general assistance'}`,
      'volunteer'
    );

    return newVol;
  }
  return mockDb.registerVolunteer(data);
};

export const updateVolunteerStatus = async (id: string, status: Volunteer['status']) => {
  if (isSupabaseConfigured) {
    const { data: oldVol } = await supabase.from('volunteers').select('*').eq('id', id).single();
    const { data: newVol, error } = await supabase
      .from('volunteers')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    await createAuditLog('update_status', 'volunteers', id, oldVol, newVol);
    return newVol;
  }
  return mockDb.updateVolunteerStatus(id, status);
};

export const getBeneficiaries = async (): Promise<Beneficiary[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getBeneficiaries failed:', e);
    }
  }
  return mockDb.getBeneficiaries();
};

export const submitBeneficiaryCase = async (data: Omit<Beneficiary, 'id' | 'case_id' | 'status' | 'created_at'>) => {
  if (isSupabaseConfigured) {
    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const caseId = `DVK-CASE-${seq}`;

    const { data: newCase, error } = await supabase
      .from('beneficiaries')
      .insert({
        case_id: caseId,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        category: data.category,
        description: data.description,
        family_info: data.family_info || null,
        income_info: data.income_info || null,
        required_assistance: data.required_assistance,
        priority: data.priority,
        supporting_docs: data.supporting_docs || [],
        status: 'submitted'
      })
      .select('*')
      .single();

    if (error) throw error;

    await createNotification(
      'New Case Support Raised',
      `${data.name} filed a new case request for ${data.category} support`,
      'case'
    );

    return newCase;
  }
  return mockDb.submitBeneficiaryCase(data);
};

export const updateBeneficiaryStatus = async (id: string, status: Beneficiary['status']) => {
  if (isSupabaseConfigured) {
    const { data: oldCase } = await supabase.from('beneficiaries').select('*').eq('id', id).single();
    const { data: newCase, error } = await supabase
      .from('beneficiaries')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    await createAuditLog('update_status', 'beneficiaries', id, oldCase, newCase);
    return newCase;
  }
  return mockDb.updateBeneficiaryStatus(id, status);
};

export const getEvents = async (): Promise<Event[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getEvents failed:', e);
    }
  }
  return mockDb.getEvents();
};

export const registerVolunteerForEvent = async (eventId: string, name: string) => {
  if (isSupabaseConfigured) {
    const { data: ev, error } = await supabase.from('events').select('registrations').eq('id', eventId).single();
    if (error) throw error;
    
    const regs = Array.isArray(ev.registrations) ? ev.registrations : [];
    if (!regs.includes(name)) {
      regs.push(name);
      const { data: newEv, error: ue } = await supabase
        .from('events')
        .update({ registrations: regs })
        .eq('id', eventId)
        .select('*')
        .single();
      if (ue) throw ue;
      return newEv;
    }
    return ev;
  }
  return mockDb.registerVolunteerForEvent(eventId, name);
};

export const createEvent = async (event: Omit<Event, 'id' | 'created_at'>): Promise<Event> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...event,
          registrations: event.registrations || [],
          status: event.status || 'upcoming'
        })
        .select('*')
        .single();
      if (!error && data) {
        await createAuditLog('created_event', 'Events', data.id, null, data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase createEvent failed:', e);
    }
  }
  return mockDb.createEvent(event);
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (!error && data) {
        await createAuditLog('updated_event', 'Events', id, null, updates);
        return data;
      }
    } catch (e) {
      console.warn('Supabase updateEvent failed:', e);
    }
  }
  return mockDb.updateEvent(id, updates);
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (!error) {
        await createAuditLog('deleted_event', 'Events', id);
        return true;
      }
    } catch (e) {
      console.warn('Supabase deleteEvent failed:', e);
    }
  }
  return mockDb.deleteEvent(id);
};

// ----------------------------------------------------
// NEWS & PRESS BULLETINS
// ----------------------------------------------------
export const getNews = async (): Promise<NewsArticle[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase getNews fallback:', e);
    }
  }
  return mockDb.getNews();
};

export const createNews = async (article: Omit<NewsArticle, 'id' | 'created_at'>): Promise<NewsArticle> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('news')
        .insert({
          ...article,
          status: article.status || 'published',
          date: article.date || new Date().toISOString().split('T')[0]
        })
        .select('*')
        .single();
      if (!error && data) {
        await createAuditLog('published_news', 'News', data.id, null, data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase createNews failed:', e);
    }
  }
  return mockDb.createNews(article);
};

export const updateNews = async (id: string, updates: Partial<NewsArticle>): Promise<NewsArticle | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('news')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (!error && data) {
        await createAuditLog('updated_news', 'News', id, null, updates);
        return data;
      }
    } catch (e) {
      console.warn('Supabase updateNews failed:', e);
    }
  }
  return mockDb.updateNews(id, updates);
};

export const deleteNews = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (!error) {
        await createAuditLog('deleted_news', 'News', id);
        return true;
      }
    } catch (e) {
      console.warn('Supabase deleteNews failed:', e);
    }
  }
  return mockDb.deleteNews(id);
};

export const getContactMessages = async (): Promise<ContactMessage[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getContactMessages failed:', e);
    }
  }
  return mockDb.getContactMessages();
};

export const submitContactMessage = async (data: Omit<ContactMessage, 'id' | 'inquiry_id' | 'status' | 'created_at'>) => {
  if (isSupabaseConfigured) {
    const seq = Math.floor(100000 + Math.random() * 900000).toString();
    const inquiryId = `DVK-INQ-${seq}`;

    const { data: newMsg, error } = await supabase
      .from('contact_messages')
      .insert({
        inquiry_id: inquiryId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) throw error;

    await createNotification(
      'New Support Inquiry Logged',
      `Inquiry message from ${data.name} on: ${data.subject}`,
      'message'
    );

    return newMsg;
  }
  return mockDb.submitContactMessage(data);
};

export const resolveContactMessage = async (id: string) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status: 'resolved' })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }
  return mockDb.resolveContactMessage(id);
};

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return (data || []).map((l: any) => ({
          id: l.id,
          user_id: l.user_id,
          user_name: l.user_name || 'System Action',
          role: l.role || 'system',
          action: l.action,
          module: l.module,
          record_id: l.record_id,
          old_data: l.old_data ? (typeof l.old_data === 'string' ? JSON.parse(l.old_data) : l.old_data) : null,
          new_data: l.new_data ? (typeof l.new_data === 'string' ? JSON.parse(l.new_data) : l.new_data) : null,
          created_at: l.created_at
        }));
      }
    } catch (e) {
      console.warn('Supabase getAuditLogs failed:', e);
    }
  }
  return mockDb.getAuditLogs();
};

export const getNotifications = async (): Promise<SystemNotification[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getNotifications failed:', e);
    }
  }
  return mockDb.getNotifications();
};

export const markNotificationsRead = async () => {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('read_status', false);
    if (error) throw error;
    return;
  }
  return mockDb.markNotificationsRead();
};

export const getSettings = async (): Promise<Settings> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
      if (!error && data) {
        return {
          orgName: data.org_name || 'Deivakaram Charitable Trust',
          orgAddress: data.org_address || '',
          orgEmail: data.org_email || '',
          orgPhone: data.org_phone || '',
          trustUpiId: data.trust_upi_id || 'ashwinop58@okicici',
          socialFacebook: data.social_facebook || '',
          socialTwitter: data.social_twitter || '',
          socialInstagram: data.social_instagram || '',
          socialLinkedin: data.social_linkedin || '',
          paymentGateway: data.payment_gateway || 'Razorpay',
          paymentApiKey: data.payment_api_key || '',
          paymentSecretKey: data.payment_secret_key || '',
          paymentWebhookUrl: data.payment_webhook_url || '',
          smtpHost: data.smtp_host || '',
          smtpPort: data.smtp_port || '',
          smtpUser: data.smtp_user || '',
          smtpPass: data.smtp_pass || '',
          smtpSenderName: data.smtp_sender_name || '',
          smtpSenderEmail: data.smtp_sender_email || '',
          twoFactorEnabled: !!data.two_factor_enabled,
          googleDriveFolderId: data.google_drive_folder_id || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
          googleDriveFolderName: data.google_drive_folder_name || 'Deivakaram Official Trust Media Drive',
          googleDriveWebhookUrl: data.google_drive_webhook_url || ''
        };
      }
    } catch (e) {
      console.warn('Supabase getSettings fallback:', e);
    }
  }
  return mockDb.getSettings();
};

export const updateSettings = async (settings: Partial<Settings>) => {
  if (isSupabaseConfigured) {
    try {
      const dbPayload: any = { id: 'default', updated_at: new Date().toISOString() };
      if (settings.orgName !== undefined) dbPayload.org_name = settings.orgName;
      if (settings.orgAddress !== undefined) dbPayload.org_address = settings.orgAddress;
      if (settings.orgEmail !== undefined) dbPayload.org_email = settings.orgEmail;
      if (settings.orgPhone !== undefined) dbPayload.org_phone = settings.orgPhone;
      if (settings.trustUpiId !== undefined) dbPayload.trust_upi_id = settings.trustUpiId;
      if (settings.paymentGateway !== undefined) dbPayload.payment_gateway = settings.paymentGateway;
      if (settings.paymentApiKey !== undefined) dbPayload.payment_api_key = settings.paymentApiKey;
      if (settings.paymentSecretKey !== undefined) dbPayload.payment_secret_key = settings.paymentSecretKey;
      if (settings.paymentWebhookUrl !== undefined) dbPayload.payment_webhook_url = settings.paymentWebhookUrl;
      if (settings.googleDriveFolderId !== undefined) dbPayload.google_drive_folder_id = settings.googleDriveFolderId;
      if (settings.googleDriveFolderName !== undefined) dbPayload.google_drive_folder_name = settings.googleDriveFolderName;
      if (settings.twoFactorEnabled !== undefined) dbPayload.two_factor_enabled = settings.twoFactorEnabled;

      const { data, error } = await supabase.from('settings').upsert(dbPayload).select('*').maybeSingle();
      if (!error && data) {
        await createAuditLog('updated_settings', 'Settings', 'default', null, dbPayload);
        return settings;
      }
    } catch (e) {
      console.warn('Supabase updateSettings fallback:', e);
    }
  }
  return mockDb.updateSettings(settings);
};

export const getUsers = async (): Promise<User[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, admin_users(permissions)')
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        return data.map((u: any) => {
          let permissions: string[] = [];
          if (u.admin_users) {
            if (Array.isArray(u.admin_users)) {
              permissions = u.admin_users[0]?.permissions || [];
            } else if (u.admin_users.permissions) {
              permissions = u.admin_users.permissions;
            }
          }
          if (u.role === 'super_admin' && permissions.length === 0) {
            permissions = ['donations', 'donors', 'volunteers', 'beneficiaries', 'campaigns', 'events', 'content', 'reports', 'settings', 'admins', 'logs'];
          }
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            created_at: u.created_at,
            permissions
          };
        });
      }
    } catch (e) {
      console.warn('Supabase getUsers failed, using mockDb fallback:', e);
    }
  }
  return mockDb.getUsers();
};

export const createSubAdmin = async (name: string, email: string, phone: string, permissions: string[]) => {
  if (isSupabaseConfigured) {
    try {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          phone,
          role: 'sub_admin',
          status: 'active'
        })
        .select('*')
        .single();

      if (!error && newUser) {
        await supabase.from('admin_users').insert({
          id: newUser.id,
          permissions,
          status: 'active'
        });

        await createAuditLog('create_admin', 'users', newUser.id, null, newUser);
        mockDb.createSubAdmin(name, email, phone, permissions);
        return { ...newUser, permissions };
      }
    } catch (err) {
      console.warn('Supabase createSubAdmin failed, falling back to local storage:', err);
    }
  }
  return mockDb.createSubAdmin(name, email, phone, permissions);
};


export const updateSubAdminPermissions = async (uId: string, permissions: string[]) => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ permissions })
      .eq('id', uId)
      .select('*')
      .single();
    if (error) throw error;
    await createAuditLog('update_permissions', 'admin_users', uId, null, data);
    return data;
  }
  return mockDb.updateSubAdminPermissions(uId, permissions);
};

export const toggleAdminStatus = async (uId: string) => {
  if (isSupabaseConfigured) {
    const { data: user } = await supabase.from('users').select('status').eq('id', uId).single();
    if (user) {
      const nextStatus = user.status === 'active' ? 'suspended' : 'active';
      const { data, error } = await supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('id', uId)
        .select('*')
        .single();
      
      if (error) throw error;
      await createAuditLog('toggle_status', 'users', uId, user, data);
      return data;
    }
  }
  return mockDb.toggleAdminStatus(uId);
};

export const updateSubAdmin = async (uId: string, updates: { name?: string; email?: string; phone?: string; role?: 'sub_admin' | 'super_admin'; permissions?: string[]; status?: 'active' | 'suspended' }) => {
  if (isSupabaseConfigured) {
    try {
      const userUpdates: any = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.email) userUpdates.email = updates.email;
      if (updates.phone !== undefined) userUpdates.phone = updates.phone;
      if (updates.role) userUpdates.role = updates.role;
      if (updates.status) userUpdates.status = updates.status;

      if (Object.keys(userUpdates).length > 0) {
        await supabase.from('users').update(userUpdates).eq('id', uId);
      }

      if (updates.permissions) {
        await supabase.from('admin_users').update({ permissions: updates.permissions }).eq('id', uId);
      }

      await createAuditLog('update_admin', 'users', uId, null, updates);
      mockDb.updateSubAdmin(uId, updates);
      return true;
    } catch (e) {
      console.warn('Supabase updateSubAdmin failed, falling back to mockDb:', e);
    }
  }
  return mockDb.updateSubAdmin(uId, updates);
};

export const deleteSubAdmin = async (uId: string) => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('admin_users').delete().eq('id', uId);
      await supabase.from('users').delete().eq('id', uId);
      await createAuditLog('delete_admin', 'users', uId, null, null);
      mockDb.deleteSubAdmin(uId);
      return true;
    } catch (e) {
      console.warn('Supabase deleteSubAdmin failed, falling back to mockDb:', e);
    }
  }
  return mockDb.deleteSubAdmin(uId);
};

// ----------------------------------------------------
// GALLERY MODULE (GOOGLE DRIVE DIRECT STORAGE)
// ----------------------------------------------------
export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase getGalleryItems fallback:', e);
    }
  }
  return mockDb.getGalleryItems();
};

export const createGalleryItem = async (item: Omit<GalleryItem, 'id' | 'created_at'>): Promise<GalleryItem> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .insert(item)
        .select('*')
        .single();
      if (!error && data) {
        await createAuditLog('uploaded_media_file', 'Gallery', data.file_name, null, data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase createGalleryItem fallback:', e);
    }
  }
  return mockDb.createGalleryItem(item);
};

export const deleteGalleryItem = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('gallery_items').delete().eq('id', id);
      if (!error) {
        await createAuditLog('deleted_media_file', 'Gallery', id);
        return true;
      }
    } catch (e) {
      console.warn('Supabase deleteGalleryItem fallback:', e);
    }
  }
  return mockDb.deleteGalleryItem(id);
};

// ----------------------------------------------------
// CELEBRATION BOOKINGS MODULE
// ----------------------------------------------------
export const getCelebrationBookings = async (): Promise<CelebrationBooking[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('celebration_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        return data.map((b: any) => ({
          id: b.id,
          booking_id: b.booking_id,
          donor_id: b.donor_id,
          donation_id: b.donation_id,
          customer_name: b.customer_name,
          donor_name: b.customer_name,
          customer_phone: b.customer_phone,
          donor_phone: b.customer_phone,
          customer_email: b.customer_email,
          donor_email: b.customer_email,
          celebrant_name: b.celebrant_name,
          occasion_type: b.occasion_type,
          occasion: b.occasion_type,
          occasion_date: b.occasion_date,
          banner_photo_url: b.banner_photo_url,
          banner_image_url: b.banner_photo_url,
          banner_photo_name: b.banner_photo_name,
          is_virtual: b.is_virtual || false,
          virtual_celebration: b.is_virtual || false,
          virtual_time_slot: b.virtual_time_slot,
          food_count: Number(b.food_count || 25),
          package_id: b.package_id,
          package_name: b.package_name,
          cake_details: b.cake_details,
          selected_addons: b.selected_addons,
          addons_selected: Array.isArray(b.selected_addons) ? b.selected_addons.map((a: any) => typeof a === 'string' ? a : a.name) : [],
          total_amount: Number(b.total_amount),
          amount: Number(b.total_amount),
          razorpay_payment_id: b.razorpay_payment_id,
          payment_id: b.razorpay_payment_id,
          razorpay_order_id: b.razorpay_order_id,
          order_id: b.razorpay_order_id,
          payment_status: b.payment_status,
          booking_status: b.booking_status,
          status: b.booking_status,
          notes: b.notes,
          special_instructions: b.notes,
          created_at: b.created_at
        }));
      }
    } catch (e) {
      console.warn('Supabase getCelebrationBookings failed, falling back to mockDb:', e);
    }
  }
  return mockDb.getCelebrationBookings();
};

export const createCelebrationBooking = async (
  booking: Omit<CelebrationBooking, 'id' | 'created_at'>
): Promise<CelebrationBooking> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('celebration_bookings')
        .insert({
          booking_id: booking.booking_id,
          donor_id: booking.donor_id || null,
          donation_id: booking.donation_id || null,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          celebrant_name: booking.celebrant_name,
          occasion_type: booking.occasion_type,
          occasion_date: booking.occasion_date,
          banner_photo_url: booking.banner_photo_url,
          banner_photo_name: booking.banner_photo_name || null,
          is_virtual: booking.is_virtual || false,
          virtual_time_slot: booking.virtual_time_slot || null,
          food_count: booking.food_count,
          package_id: booking.package_id,
          package_name: booking.package_name,
          cake_details: booking.cake_details || null,
          selected_addons: booking.selected_addons || [],
          total_amount: booking.total_amount,
          razorpay_payment_id: booking.razorpay_payment_id || null,
          razorpay_order_id: booking.razorpay_order_id || null,
          payment_status: booking.payment_status || 'successful',
          booking_status: booking.booking_status || 'confirmed',
          notes: booking.notes || null
        })
        .select('*')
        .single();

      if (!error && data) {
        await createAuditLog('create_celebration_booking', 'Celebrations', data.booking_id, null, data);
        await createNotification(
          'New Celebration Booking',
          `${booking.customer_name} booked celebration for ${booking.celebrant_name} (₹${booking.total_amount}).`,
          'donation'
        );
        mockDb.createCelebrationBooking(booking);
        return {
          ...data,
          total_amount: Number(data.total_amount),
          food_count: Number(data.food_count)
        };
      }
    } catch (e) {
      console.warn('Supabase createCelebrationBooking failed, falling back to mockDb:', e);
    }
  }
  return mockDb.createCelebrationBooking(booking);
};

export const updateCelebrationBooking = async (
  id: string,
  updates: Partial<CelebrationBooking>
): Promise<CelebrationBooking | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('celebration_bookings')
        .update({
          ...updates,
          total_amount: updates.total_amount !== undefined ? updates.total_amount : undefined
        })
        .eq('id', id)
        .select('*')
        .single();

      if (!error && data) {
        await createAuditLog('update_celebration_booking', 'Celebrations', data.booking_id, null, updates);
        mockDb.updateCelebrationBooking(id, updates);
        return {
          ...data,
          total_amount: Number(data.total_amount),
          food_count: Number(data.food_count)
        };
      }
    } catch (e) {
      console.warn('Supabase updateCelebrationBooking failed, falling back to mockDb:', e);
    }
  }
  return mockDb.updateCelebrationBooking(id, updates);
};

export const deleteCelebrationBooking = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('celebration_bookings').delete().eq('id', id);
      await createAuditLog('delete_celebration_booking', 'Celebrations', id, null, null);
      mockDb.deleteCelebrationBooking(id);
      return true;
    } catch (e) {
      console.warn('Supabase deleteCelebrationBooking failed, falling back to mockDb:', e);
    }
  }
  return mockDb.deleteCelebrationBooking(id);
};

// ----------------------------------------------------
// DYNAMIC PACKAGES & ADDONS MODULE
// ----------------------------------------------------
export const getDynamicPackages = async (): Promise<DynamicPackage[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      if (!error && data) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          title: p.name,
          basePrice: Number(p.base_price),
          base_price: Number(p.base_price),
          minFoodCount: Number(p.min_food_count || 25),
          min_meals: Number(p.min_food_count || 25),
          tagline: p.tagline,
          description: p.tagline,
          badge: p.badge,
          icon: p.icon,
          inclusions: p.inclusions || [],
          note: p.note,
          is_popular: p.badge === 'Popular',
          is_active: p.is_active,
          updated_at: p.updated_at
        }));
      }
    } catch (e) {
      console.warn('Supabase getDynamicPackages failed, falling back to mockDb:', e);
    }
  }
  return mockDb.getDynamicPackages();
};

export const saveDynamicPackage = async (pkg: Partial<DynamicPackage>): Promise<DynamicPackage> => {
  const pkgId = pkg.id || `pkg-${Date.now()}`;
  const fullPkg: DynamicPackage = {
    id: pkgId,
    name: pkg.name || pkg.title || 'Celebration Package',
    title: pkg.title || pkg.name || 'Celebration Package',
    basePrice: pkg.basePrice ?? pkg.base_price ?? 3000,
    base_price: pkg.base_price ?? pkg.basePrice ?? 3000,
    minFoodCount: pkg.minFoodCount ?? pkg.min_meals ?? 25,
    min_meals: pkg.min_meals ?? pkg.minFoodCount ?? 25,
    tagline: pkg.tagline || pkg.description || '',
    description: pkg.description || pkg.tagline || '',
    badge: pkg.badge || (pkg.is_popular ? 'Popular' : 'Standard'),
    icon: pkg.icon || 'cake',
    inclusions: pkg.inclusions || [],
    note: pkg.note || 'Full photography and live stream video included.',
    is_popular: pkg.is_popular,
    is_active: pkg.is_active !== undefined ? pkg.is_active : true,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('packages')
        .upsert({
          id: fullPkg.id,
          name: fullPkg.name,
          base_price: fullPkg.basePrice,
          min_food_count: fullPkg.minFoodCount,
          tagline: fullPkg.tagline,
          badge: fullPkg.badge,
          icon: fullPkg.icon,
          inclusions: fullPkg.inclusions,
          note: fullPkg.note,
          is_active: fullPkg.is_active,
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (!error && data) {
        await createAuditLog('save_package', 'Settings', fullPkg.name, null, fullPkg);
        mockDb.updateDynamicPackage(fullPkg.id, fullPkg);
        return {
          ...data,
          title: data.name,
          basePrice: Number(data.base_price),
          base_price: Number(data.base_price),
          minFoodCount: Number(data.min_food_count),
          min_meals: Number(data.min_food_count),
          description: data.tagline
        };
      }
    } catch (e) {
      console.warn('Supabase saveDynamicPackage failed, falling back to mockDb:', e);
    }
  }
  return mockDb.updateDynamicPackage(fullPkg.id, fullPkg) || mockDb.createDynamicPackage(fullPkg);
};

export const deleteDynamicPackage = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('packages').delete().eq('id', id);
      await createAuditLog('delete_package', 'Settings', id, null, null);
      mockDb.deleteDynamicPackage(id);
      return true;
    } catch (e) {
      console.warn('Supabase deleteDynamicPackage failed, falling back to mockDb:', e);
    }
  }
  return mockDb.deleteDynamicPackage(id);
};

export const getDynamicAddons = async (): Promise<DynamicAddon[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (!error && data) {
        return data.map((a: any) => ({
          id: a.id,
          name: a.name,
          price: Number(a.price),
          desc: a.description || a.desc,
          description: a.description || a.desc,
          unit: a.is_per_unit ? 'per pack' : 'per item',
          isPerUnit: a.is_per_unit,
          is_active: a.is_active,
          updated_at: a.updated_at
        }));
      }
    } catch (e) {
      console.warn('Supabase getDynamicAddons failed, falling back to mockDb:', e);
    }
  }
  return mockDb.getDynamicAddons();
};

export const saveDynamicAddon = async (addon: Partial<DynamicAddon>): Promise<DynamicAddon> => {
  const addonId = addon.id || `addon-${Date.now()}`;
  const fullAddon: DynamicAddon = {
    id: addonId,
    name: addon.name || 'Festive Add-on',
    price: addon.price ?? 500,
    desc: addon.desc || addon.description || '',
    description: addon.description || addon.desc || '',
    unit: addon.unit || (addon.isPerUnit ? 'per pack' : 'per item'),
    isPerUnit: addon.isPerUnit !== undefined ? addon.isPerUnit : true,
    is_active: addon.is_active !== undefined ? addon.is_active : true,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('addons')
        .upsert({
          id: fullAddon.id,
          name: fullAddon.name,
          price: fullAddon.price,
          description: fullAddon.desc,
          is_per_unit: fullAddon.isPerUnit,
          is_active: fullAddon.is_active,
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (!error && data) {
        await createAuditLog('save_addon', 'Settings', fullAddon.name, null, fullAddon);
        mockDb.updateDynamicAddon(fullAddon.id, fullAddon);
        return {
          ...data,
          price: Number(data.price),
          desc: data.description,
          description: data.description,
          isPerUnit: data.is_per_unit,
          unit: fullAddon.unit
        };
      }
    } catch (e) {
      console.warn('Supabase saveDynamicAddon failed, falling back to mockDb:', e);
    }
  }
  return mockDb.updateDynamicAddon(fullAddon.id, fullAddon) || mockDb.createDynamicAddon(fullAddon);
};

export const deleteDynamicAddon = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('addons').delete().eq('id', id);
      await createAuditLog('delete_addon', 'Settings', id, null, null);
      mockDb.deleteDynamicAddon(id);
      return true;
    } catch (e) {
      console.warn('Supabase deleteDynamicAddon failed, falling back to mockDb:', e);
    }
  }
  return mockDb.deleteDynamicAddon(id);
};

export { sanitizeDriveFolderId } from './mockDb';
export { checkSupabaseHealth } from './supabaseClient';

// Re-export core interface structures for import cleanups

export type { 
  Donation, Donor, Campaign, Volunteer, Beneficiary, 
  Event, ContactMessage, AuditLog, User, SystemNotification, Settings, GalleryItem,
  CelebrationBooking, DynamicPackage, DynamicAddon, NewsArticle
};
