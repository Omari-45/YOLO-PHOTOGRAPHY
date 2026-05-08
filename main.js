import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase Configuration
const SUPABASE_CONFIG = {
  URL: 'https://tbzthpiirwexfbldxbqe.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRienRocGlpcndleGZibGR4YnFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDU3MTAsImV4cCI6MjA5MzIyMTcxMH0._6XlZ7OFgkSeQmvK2V1Hl7w2pjhuadCbiP5qBAh1PCQ'
};

const ADMIN_EMAIL = 'davidomari006@gmail.com';
const SUPERADMIN_EMAIL = 'davidomari006@gmail.com'; // Same as admin for now, can be changed later
const LOGO_BUCKET = 'site-assets';
const GALLERY_BUCKET = 'portfolios';
const CATEGORIES = ['Studio', 'Wedding', 'Ruracio', 'Editorial', 'Lifestyle'];
const BRAND_ACCENT_COLOR = '#334155';
const REVIEW_TABLES = ['reviews'];

const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

const pageType = document.body.dataset.page;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

async function fetchSiteSettings(columns = '*') {
  const { data, error } = await supabase
    .from('site_settings')
    .select(columns)
    .limit(1)
    .maybeSingle();

  return { data, error };
}

async function saveSiteSettings(updates) {
  const { data: currentSettings, error: fetchError } = await fetchSiteSettings('id');
  if (fetchError) return { error: fetchError };

  if (currentSettings?.id) {
    return supabase
      .from('site_settings')
      .update(updates)
      .eq('id', currentSettings.id);
  }

  return supabase
    .from('site_settings')
    .insert([updates]);
}

function isMissingTableError(error) {
  return error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '');
}

async function selectReviews({ publishedOnly = false } = {}) {
  for (const table of REVIEW_TABLES) {
    let query = supabase
      .from(table)
      .select('id,client_name,quote,is_published,created_at')
      .order('created_at', { ascending: false });
    if (publishedOnly) query = query.eq('is_published', true);
    const result = await query;
    if (!result.error || !isMissingTableError(result.error)) return result;
  }

  return { data: [], error: null };
}

async function insertReviewDraft({ client_name, quote }) {
  const payload = { client_name, quote, is_published: false };
  for (const table of REVIEW_TABLES) {
    const result = await supabase.from(table).insert([payload]);
    if (!result.error || !isMissingTableError(result.error)) return result;
  }

  return { error: new Error('Reviews table was not found.') };
}

async function updateReviewPublish(id, is_published) {
  for (const table of REVIEW_TABLES) {
    const result = await supabase.from(table).update({ is_published }).eq('id', id);
    if (!result.error || !isMissingTableError(result.error)) return result;
  }

  return { error: new Error('Reviews table was not found.') };
}

async function deleteReview(id) {
  for (const table of REVIEW_TABLES) {
    const result = await supabase.from(table).delete().eq('id', id);
    if (!result.error || !isMissingTableError(result.error)) return result;
  }

  return { error: new Error('Reviews table was not found.') };
}

// Helper functions for role checking
function isSuperAdmin(email) {
  return email === SUPERADMIN_EMAIL;
}

function isAdmin(email) {
  return email === ADMIN_EMAIL || isSuperAdmin(email);
}

function canDeleteUser(currentUserEmail, targetUserEmail) {
  // Superadmin can delete anyone except themselves
  if (isSuperAdmin(currentUserEmail)) {
    return targetUserEmail !== SUPERADMIN_EMAIL;
  }
  // Regular admin cannot delete superadmin or other admins
  return !isAdmin(targetUserEmail);
}

async function getAllowedEmails() {
  try {
    const { data, error } = await fetchSiteSettings('admin_emails');
    if (error) {
      // If table doesn't exist or error, return default
      return ['davidomari006@gmail.com'];
    }
    // If no admin_emails set, return default
    return data?.admin_emails || ['davidomari006@gmail.com'];
  } catch {
    return ['davidomari006@gmail.com'];
  }
}

function setAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  const accentLabel = $('#accentColorLabel');
  if (accentLabel) accentLabel.textContent = color;
}

function createStoragePath(folder, file) {
  const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
  return `${folder}/${Date.now()}-${safeName}`;
}

async function loadAdminPage() {
  const session = await supabase.auth.getSession();
  const allowedEmails = await getAllowedEmails();

  if (session.data?.session?.user?.email && allowedEmails.includes(session.data.session.user.email)) {
    window.location.href = '/admin';
    return;
  }

  const loginForm = $('#loginForm');
  const emailInput = $('#loginEmail');
  const passwordInput = $('#loginPassword');
  const message = $('#loginMessage');
  const resetPasswordBtn = $('#resetPasswordBtn');

  // Handle email/password login
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    // Check if user is authorized admin
    const allowedEmails = await getAllowedEmails();
    if (!data.user?.email || !allowedEmails.includes(data.user.email)) {
      message.textContent = 'Only authorized admins may access the admin dashboard.';
      await supabase.auth.signOut();
      return;
    }

    window.location.href = '/admin';
  });

  // Handle password reset
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      if (!email) {
        message.textContent = 'Please enter your email address first.';
        return;
      }

      message.textContent = 'Sending password reset email...';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://yolo-photography.vercel.app/admin/update-password'
      });

      if (error) {
        message.textContent = error.message;
      } else {
        message.textContent = 'Password reset email sent! Check your inbox and spam folder.';
      }
    });
  }
}

async function loadDashboardPage() {
  const session = await supabase.auth.getSession();
  const allowedEmails = await getAllowedEmails();

  if (!session.data?.session?.user?.email || !allowedEmails.includes(session.data.session.user.email)) {
    window.location.href = '/admin.html';
    return;
  }

  const logoutButton = $('#logoutButton');
  const currentLogo = $('#currentLogo');
  const logoInput = $('#logoInput');
  const logoPreview = $('#logoPreview');
  const logoMessage = $('#logoMessage');
  const uploadLogoButton = $('#uploadLogoButton');
  const galleryInput = $('#galleryInput');
  const dropZone = $('#dropZone');
  const categorySelect = $('#categorySelect');
  const galleryPreview = $('#galleryPreview');
  const galleryMessage = $('#galleryMessage');
  const uploadGalleryButton = $('#uploadGalleryButton');
  const galleryGrid = $('#galleryGrid');
  const galleryCount = $('#galleryCount');

  let selectedLogoFile = null;
  let selectedGalleryFile = null;

  setAccentColor(BRAND_ACCENT_COLOR);

  CATEGORIES.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });

  const locationInput = $('#locationInput');
  const locationMessage = $('#locationMessage');
  const updateLocationButton = $('#updateLocationButton');
  const totalVisits = $('#totalVisits');
  const recentBookings = $('#recentBookings');

  // New selectors
  const tiktokInput = $('#tiktokInput');
  const instagramInput = $('#instagramInput');
  const facebookInput = $('#facebookInput');
  const updateSocialButton = $('#updateSocialButton');
  const socialMessage = $('#socialMessage');

  const whatsappInput = $('#whatsappInput');
  const dayMessageInput = $('#dayMessageInput');
  const nightMessageInput = $('#nightMessageInput');
  const updateWhatsappButton = $('#updateWhatsappButton');
  const whatsappMessage = $('#whatsappMessage');

  const phoneInput = $('#phoneInput');
  const emailInput = $('#emailInput');
  const mapsInput = $('#mapsInput');
  const updateContactButton = $('#updateContactButton');
  const contactMessage = $('#contactMessage');

  const serviceTitleInput = $('#serviceTitleInput');
  const serviceDescInput = $('#serviceDescInput');
  const servicePriceInput = $('#servicePriceInput');
  const serviceIconInput = $('#serviceIconInput');
  const addServiceButton = $('#addServiceButton');
  const serviceMessage = $('#serviceMessage');
  const servicesList = $('#servicesList');

  const toggleThemeButton = $('#toggleThemeButton');
  const currentTheme = $('#currentTheme');

  const sectionButtons = $$('.sidebar-link');
  const bottomNavButtons = $$('.bottom-nav-button');
  const adminPanels = $$('.admin-panel');

  // User Management (Super Admin Only)
  const adminsPanel = $('#adminsPanel');
  const newAdminEmailInput = $('#newAdminEmailInput');
  const addAdminButton = $('#addAdminButton');
  const addAdminMessage = $('#addAdminMessage');
  const adminUsersList = $('#adminUsersList');

  // Testimonials workflow
  const testimonialNameInput = $('#testimonialNameInput');
  const testimonialRoleInput = $('#testimonialRoleInput');
  const testimonialQuoteInput = $('#testimonialQuoteInput');
  const testimonialMessage = $('#testimonialMessage');
  const saveTestimonialButton = $('#saveTestimonialButton');
  const testimonialsList = $('#testimonialsList');

  let currentLocation = 'Voi, Kenya';

  async function fetchSettings() {
    const { data, error } = await fetchSiteSettings();
    if (error) return;
    if (data?.logo_url) {
      currentLogo.innerHTML = `<img src="${escapeHtml(data.logo_url)}" alt="Site logo" />`;
    }
    setAccentColor(BRAND_ACCENT_COLOR);
    if (data?.business_location) {
      currentLocation = data.business_location;
      locationInput.value = currentLocation;
    }
    if (data?.tiktok_link) tiktokInput.value = data.tiktok_link;
    if (data?.instagram_link) instagramInput.value = data.instagram_link;
    if (data?.facebook_link) facebookInput.value = data.facebook_link;
    if (data?.whatsapp_number) whatsappInput.value = data.whatsapp_number;
    if (data?.day_message) dayMessageInput.value = data.day_message;
    if (data?.night_message) nightMessageInput.value = data.night_message;
    if (data?.phone) phoneInput.value = data.phone;
    if (data?.email) emailInput.value = data.email;
    if (data?.google_maps_link) mapsInput.value = data.google_maps_link;
    if (data?.theme) {
      currentTheme.textContent = data.theme === 'dark' ? 'Dark' : 'Light';
      document.documentElement.setAttribute('data-theme', data.theme);
    }
  }

  async function updateLocation() {
    const newLocation = locationInput.value.trim();
    if (!newLocation) {
      locationMessage.textContent = 'Please enter a location.';
      return;
    }

    locationMessage.textContent = '';
    updateLocationButton.disabled = true;
    updateLocationButton.textContent = 'Updating...';

    const { error } = await saveSiteSettings({ business_location: newLocation });

    if (error) {
      locationMessage.textContent = error.message;
    } else {
      locationMessage.textContent = 'Location updated successfully.';
      currentLocation = newLocation;
    }

    updateLocationButton.disabled = false;
    updateLocationButton.textContent = 'Update Location';
  }

  async function fetchAnalytics() {
    // Total visits
    const { count: visitCount, error: visitError } = await supabase
      .from('site_visits')
      .select('*', { count: 'exact', head: true });

    if (!visitError) {
      totalVisits.textContent = visitCount || 0;
    }

    // Recent bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('client_name,service_type,event_location,event_date,created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (bookingError) {
      recentBookings.innerHTML = '<p class="text-sm text-red-500">Unable to load bookings.</p>';
      return;
    }

    if (!bookings || bookings.length === 0) {
      recentBookings.innerHTML = '<p class="text-sm text-slate-500">No bookings yet.</p>';
      return;
    }

    recentBookings.innerHTML = bookings.map(booking => `
      <div class="border border-slate-200 rounded-lg p-3 bg-slate-50">
        <p class="text-sm font-semibold text-slate-900">${escapeHtml(booking.client_name)}</p>
        <p class="text-xs text-slate-600">${booking.service_type} • ${booking.event_location}</p>
        <p class="text-xs text-slate-500">${escapeHtml(new Date(booking.event_date).toLocaleDateString())}</p>
      </div>
    `).join('');
  }

  function activateAdminSection(sectionName) {
    adminPanels.forEach(panel => {
      panel.style.display = panel.id === sectionName ? 'block' : 'none';
    });

    sectionButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.section === sectionName);
    });

    bottomNavButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.section === sectionName);
    });

    if (sectionName === 'admins') {
      showUserManagement();
    }

    if (sectionName === 'testimonials') {
      fetchTestimonials();
    }
  }

  async function fetchTestimonials() {
    const { data, error } = await selectReviews();
    if (error) {
      testimonialsList.innerHTML = '<p class="text-sm text-red-500">Unable to load testimonials.</p>';
      return;
    }

    if (!data || data.length === 0) {
      testimonialsList.innerHTML = '<p class="muted">No testimonials yet.</p>';
      return;
    }

    testimonialsList.innerHTML = data.map(item => `
      <div class="border border-slate-200 rounded-lg p-3 bg-slate-50">
        <div class="flex justify-between items-start gap-3">
          <div>
            <p class="text-sm font-semibold text-slate-900">${escapeHtml(item.client_name)}</p>
            <p class="text-sm text-slate-700">${escapeHtml(item.quote)}</p>
          </div>
          <div class="text-right">
            <label class="publish-toggle">
              <input type="checkbox" ${item.is_published ? 'checked' : ''} onchange="toggleTestimonialPublish(${JSON.stringify(item.id)}, this.checked)" />
              <span>${item.is_published ? 'Published' : 'Publish'}</span>
            </label>
            <button type="button" onclick="deleteTestimonial(${JSON.stringify(item.id)})" class="admin-delete-button">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 4 1 10h8l1-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Delete
            </button>
          </div>
        </div>
        <p class="text-xs ${item.is_published ? 'text-emerald-600' : 'text-slate-500'} mt-3">${item.is_published ? 'Published' : 'Draft'}</p>
      </div>
    `).join('');
  }

  async function saveTestimonial() {
    testimonialMessage.textContent = '';
    const name = testimonialNameInput.value.trim();
    const quote = testimonialQuoteInput.value.trim();

    if (!name || !quote) {
      testimonialMessage.textContent = 'Client name and quote are required to save a review.';
      return;
    }

    const { error } = await insertReviewDraft({ client_name: name, quote });
    if (error) {
      testimonialMessage.textContent = error.message;
      return;
    }

    testimonialMessage.textContent = 'Testimonial saved as draft.';
    testimonialNameInput.value = '';
    testimonialRoleInput.value = '';
    testimonialQuoteInput.value = '';
    await fetchTestimonials();
  }

  async function toggleTestimonialPublish(id, publish) {
    const { error } = await updateReviewPublish(id, publish);
    if (error) {
      alert('Unable to update testimonial status: ' + error.message);
      return;
    }

    await fetchTestimonials();
  }

  async function deleteTestimonial(id) {
    if (!confirm('Remove this testimonial?')) return;
    const { error } = await deleteReview(id);
    if (error) {
      alert('Unable to delete testimonial: ' + error.message);
      return;
    }

    await fetchTestimonials();
  }

  async function updateSocial() {
    const updates = {
      tiktok_link: tiktokInput.value.trim(),
      instagram_link: instagramInput.value.trim(),
      facebook_link: facebookInput.value.trim(),
    };
    const { error } = await saveSiteSettings(updates);
    if (error) {
      socialMessage.textContent = error.message;
    } else {
      socialMessage.textContent = 'Social links updated successfully.';
    }
  }

  async function updateWhatsapp() {
    const updates = {
      whatsapp_number: whatsappInput.value.trim(),
      day_message: dayMessageInput.value.trim(),
      night_message: nightMessageInput.value.trim(),
    };
    const { error } = await saveSiteSettings(updates);
    if (error) {
      whatsappMessage.textContent = error.message;
    } else {
      whatsappMessage.textContent = 'WhatsApp settings updated successfully.';
    }
  }

  async function updateContact() {
    const updates = {
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      google_maps_link: mapsInput.value.trim(),
    };
    const { error } = await saveSiteSettings(updates);
    if (error) {
      contactMessage.textContent = error.message;
    } else {
      contactMessage.textContent = 'Contact info updated successfully.';
    }
  }

  async function fetchServices() {
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    if (error) {
      servicesList.innerHTML = '<p class="text-sm text-red-500">Unable to load services.</p>';
      return;
    }
    if (!data || data.length === 0) {
      servicesList.innerHTML = '<p class="muted">No services added yet.</p>';
      return;
    }
    servicesList.innerHTML = data.map(service => `
      <div class="service-row">
        <div class="service-row-main">
          <div class="service-icon">${service.icon || 'Camera'}</div>
          <div>
            <p class="service-title">${service.service_name}</p>
            <p class="service-description">${service.description}</p>
            <p class="service-price">${service.price || 'Price not set'}</p>
          </div>
        </div>
        <button type="button" onclick="deleteService(${service.id})" class="service-delete-button">Delete</button>
      </div>
    `).join('');
  }

  async function addService() {
    const serviceName = serviceTitleInput.value.trim();
    const description = serviceDescInput.value.trim();
    const price = servicePriceInput.value.trim();
    const icon = serviceIconInput.value.trim() || 'Camera';

    if (!serviceName || !description) {
      serviceMessage.textContent = 'Service name and description are required.';
      return;
    }

    const { error } = await supabase.from('services').insert([{ service_name: serviceName, description, price, icon }]);
    if (error) {
      serviceMessage.textContent = error.message;
    } else {
      serviceMessage.textContent = 'Service added successfully.';
      serviceTitleInput.value = '';
      serviceDescInput.value = '';
      servicePriceInput.value = '';
      serviceIconInput.value = 'Camera';
      await fetchServices();
    }
  }

  async function deleteService(id) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      alert('Error deleting service: ' + error.message);
    } else {
      await fetchServices();
    }
  }

  async function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';
    const { error } = await saveSiteSettings({ theme: newTheme });
    if (error) {
      alert('Error updating theme: ' + error.message);
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
      currentTheme.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
    }
  }

  // Make deleteService global
  window.deleteService = deleteService;

  // User Management Functions (Super Admin Only)
  async function showUserManagement() {
    const session = await supabase.auth.getSession();
    const currentUserEmail = session.data?.session?.user?.email;

    if (isSuperAdmin(currentUserEmail)) {
      await fetchAdminUsers();
      return;
    }

    adminUsersList.innerHTML = '<p class="text-sm text-slate-600">Only the super admin can manage login access.</p>';
  }

  async function fetchAdminUsers() {
    // For now, we'll store admin emails in site_settings
    // In a real app, you'd have a separate admin_users table
    const { data, error } = await fetchSiteSettings('admin_emails');
    const fallbackAdmins = ['davidomari006@gmail.com'];

    let adminEmails = fallbackAdmins;

    if (error) {
      if (error.message?.includes('admin_emails')) {
        adminEmails = fallbackAdmins;
      } else {
        adminUsersList.innerHTML = '<p class="text-sm text-red-500">Unable to load admin users.</p>';
        return;
      }
    } else {
      adminEmails = data?.admin_emails || fallbackAdmins;
    }

    const session = await supabase.auth.getSession();
    const currentUserEmail = session.data?.session?.user?.email;

    adminUsersList.innerHTML = adminEmails.map(email => `
      <div class="border border-slate-200 rounded-lg p-3 bg-slate-50">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-sm font-semibold text-slate-900">${email}</p>
            <p class="text-xs text-slate-600">${email === SUPERADMIN_EMAIL ? 'Super Admin' : 'Admin'}</p>
          </div>
          ${canDeleteUser(currentUserEmail, email) ?
            `<button onclick="deleteAdminUser('${email}')" class="text-red-500 hover:text-red-700 text-sm">Remove</button>` :
            `<span class="text-xs text-slate-500">Cannot remove</span>`
          }
        </div>
      </div>
    `).join('');
  }

  async function addAdminUser() {
    const newEmail = newAdminEmailInput.value.trim().toLowerCase();
    if (!newEmail) {
      addAdminMessage.textContent = 'Please enter an email address.';
      return;
    }

    if (!newEmail.includes('@')) {
      addAdminMessage.textContent = 'Please enter a valid email address.';
      return;
    }

    // Get current admin emails
    const { data, error: fetchError } = await fetchSiteSettings('admin_emails');
    if (fetchError) {
      addAdminMessage.textContent = fetchError.message;
      return;
    }

    const currentAdmins = data?.admin_emails || ['davidomari006@gmail.com'];

    if (currentAdmins.includes(newEmail)) {
      addAdminMessage.textContent = 'This email is already an admin.';
      return;
    }

    // Add new admin
    const updatedAdmins = [...currentAdmins, newEmail];
    const { error: updateError } = await saveSiteSettings({ admin_emails: updatedAdmins });

    if (updateError) {
      addAdminMessage.textContent = updateError.message;
      return;
    }

    addAdminMessage.textContent = 'Admin user added successfully.';
    newAdminEmailInput.value = '';
    await fetchAdminUsers();
  }

  async function deleteAdminUser(email) {
    const session = await supabase.auth.getSession();
    const currentUserEmail = session.data?.session?.user?.email;

    if (!canDeleteUser(currentUserEmail, email)) {
      alert('You cannot delete this admin user.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${email} from admin access?`)) {
      return;
    }

    // Get current admin emails
    const { data, error: fetchError } = await fetchSiteSettings('admin_emails');
    if (fetchError) {
      alert('Error fetching admin users: ' + fetchError.message);
      return;
    }

    const currentAdmins = data?.admin_emails || ['davidomari006@gmail.com'];
    const updatedAdmins = currentAdmins.filter(adminEmail => adminEmail !== email);

    const { error: updateError } = await saveSiteSettings({ admin_emails: updatedAdmins });

    if (updateError) {
      alert('Error removing admin user: ' + updateError.message);
      return;
    }

    alert('Admin user removed successfully.');
    await fetchAdminUsers();
  }

  // Make deleteAdminUser global
  window.deleteAdminUser = deleteAdminUser;
  window.toggleTestimonialPublish = toggleTestimonialPublish;
  window.deleteTestimonial = deleteTestimonial;

  async function fetchGallery() {
    const { data, error } = await supabase.from('galleries').select('*').order('created_at', { ascending: false });
    if (error) {
      galleryGrid.innerHTML = '<p class="muted">Unable to load gallery items.</p>';
      return;
    }

    galleryGrid.innerHTML = '';
    const items = data || [];
    galleryCount.textContent = `${items.length} uploaded image${items.length === 1 ? '' : 's'}`;

    if (!items.length) {
      galleryGrid.innerHTML = '<div class="gallery-empty">No images uploaded yet.</div>';
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'gallery-item';
      card.innerHTML = `
        <img src="${item.image_url}" alt="${item.category}" />
        <div class="gallery-meta">
          <p class="panel-label">${item.category}</p>
          <button type="button" class="admin-delete-button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 4 1 10h8l1-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Delete
          </button>
        </div>
      `;
      const button = card.querySelector('button');
      button.addEventListener('click', () => removeGalleryItem(item));
      galleryGrid.appendChild(card);
    });
  }

  async function removeGalleryItem(item) {
    galleryMessage.textContent = '';
    const { error: storageError } = await supabase.storage.from(GALLERY_BUCKET).remove([item.storage_path]);
    if (storageError) {
      galleryMessage.textContent = storageError.message;
      return;
    }

    const { error: deleteError } = await supabase.from('galleries').delete().eq('id', item.id);
    if (deleteError) {
      galleryMessage.textContent = deleteError.message;
      return;
    }

    galleryMessage.textContent = 'Image removed successfully.';
    await fetchGallery();
  }

  async function uploadLogo() {
    logoMessage.textContent = '';
    if (!selectedLogoFile) {
      logoMessage.textContent = 'Please choose a logo file.';
      return;
    }

    uploadLogoButton.disabled = true;
    uploadLogoButton.textContent = 'Uploading...';

    try {
      const storagePath = createStoragePath('logos', selectedLogoFile);
      const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(storagePath, selectedLogoFile, {
        cacheControl: '3600',
        upsert: true,
      });

      if (uploadError) {
        logoMessage.textContent = uploadError.message;
        return;
      }

      const { data: urlData, error: publicError } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(storagePath);
      if (publicError || !urlData?.publicUrl) {
        logoMessage.textContent = publicError?.message || 'Unable to get logo URL.';
        return;
      }

      const { error: settingsError } = await saveSiteSettings({
        logo_url: urlData.publicUrl,
      });

      if (settingsError) {
        logoMessage.textContent = settingsError.message;
        return;
      }

      logoMessage.textContent = 'Logo uploaded and branding updated.';
      currentLogo.innerHTML = `<img src="${urlData.publicUrl}" alt="Site logo" />`;
      setAccentColor(BRAND_ACCENT_COLOR);
      selectedLogoFile = null;
      logoPreview.innerHTML = '';
      logoInput.value = '';
    } finally {
      uploadLogoButton.disabled = false;
      uploadLogoButton.textContent = 'Upload logo';
    }
  }

  async function uploadGallery() {
    galleryMessage.textContent = '';
    if (!selectedGalleryFile) {
      galleryMessage.textContent = 'Please choose a gallery image first.';
      return;
    }

    uploadGalleryButton.disabled = true;
    uploadGalleryButton.textContent = 'Uploading...';

    try {
      const storagePath = createStoragePath('galleries', selectedGalleryFile);
      const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(storagePath, selectedGalleryFile, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        galleryMessage.textContent = uploadError.message;
        return;
      }

      const { data: urlData, error: publicError } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath);
      if (publicError || !urlData?.publicUrl) {
        galleryMessage.textContent = publicError?.message || 'Unable to get image URL.';
        return;
      }

      const { error: insertError } = await supabase.from('galleries').insert([
        {
          image_url: urlData.publicUrl,
          category: categorySelect.value,
          storage_path: storagePath,
        },
      ]);

      if (insertError) {
        galleryMessage.textContent = insertError.message;
        return;
      }

      galleryMessage.textContent = 'Image uploaded successfully.';
      selectedGalleryFile = null;
      galleryPreview.innerHTML = '';
      galleryInput.value = '';
      await fetchGallery();
    } finally {
      uploadGalleryButton.disabled = false;
      uploadGalleryButton.textContent = 'Upload media';
    }
  }

  function renderLogoPreview(file) {
    const reader = new FileReader();
    reader.onload = () => {
      galleryPreview.innerHTML = `<img src="${reader.result}" alt="Selected image preview" />`;
    };
    reader.readAsDataURL(file);
  }

  logoInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    selectedLogoFile = file;
    logoMessage.textContent = '';
    const reader = new FileReader();
    reader.onload = () => {
      logoPreview.innerHTML = `<img src="${reader.result}" alt="Logo preview" />`;
    };
    reader.readAsDataURL(file);
  });

  galleryInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    selectedGalleryFile = file;
    galleryMessage.textContent = '';
    renderLogoPreview(file);
  });

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drop-zone-active');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drop-zone-active');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drop-zone-active');
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    selectedGalleryFile = file;
    galleryMessage.textContent = '';
    galleryInput.files = event.dataTransfer.files;
    renderLogoPreview(file);
  });

  uploadLogoButton.addEventListener('click', uploadLogo);
  uploadGalleryButton.addEventListener('click', uploadGallery);
  logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin.html';
  });

  updateLocationButton.addEventListener('click', updateLocation);
  updateSocialButton.addEventListener('click', updateSocial);
  updateWhatsappButton.addEventListener('click', updateWhatsapp);
  updateContactButton.addEventListener('click', updateContact);
  addServiceButton.addEventListener('click', addService);
  toggleThemeButton.addEventListener('click', toggleTheme);

  // User Management Event Listeners (Super Admin Only)
  addAdminButton.addEventListener('click', addAdminUser);

  sectionButtons.forEach((button) => {
    button.addEventListener('click', () => activateAdminSection(button.dataset.section));
  });

  bottomNavButtons.forEach((button) => {
    button.addEventListener('click', () => activateAdminSection(button.dataset.section));
  });

  saveTestimonialButton.addEventListener('click', saveTestimonial);

  activateAdminSection('branding');

  await fetchSettings();
  await fetchGallery();
  await fetchAnalytics();
  await fetchServices();
  await showUserManagement(); // Show user management for super admin
}

async function init() {
  if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY || !ADMIN_EMAIL) {
    console.warn('Supabase config placeholder values must be updated in main.js');
  }

  if (pageType === 'admin') {
    await loadAdminPage();
    return;
  }

  if (pageType === 'dashboard') {
    await loadDashboardPage();
    return;
  }
}

init();
