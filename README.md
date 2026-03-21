# Sambadh.ai - Connecting Retailers & Customers

A full-stack WhatsApp-based CRM platform for Indian small businesses. Built with vanilla JavaScript and localStorage for data persistence.

## 🚀 Features

### For Business Owners
- **QR Code Customer Capture** - Collect customer data effortlessly
- **WhatsApp Automation** - Send campaigns and reminders
- **Smart Analytics** - Track retention and growth
- **Multi-language Support** - Hindi & English
- **Loyalty Programs** - Digital rewards and referrals

### For Admin
- **User Management** - View all registered businesses
- **Revenue Tracking** - MRR and ARR calculations
- **Analytics Dashboard** - Platform-wide insights
- **Data Export** - Download all data in JSON format

## 📋 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: localStorage (client-side)
- **Fonts**: Google Fonts (Syne, DM Sans)
- **Deployment**: GitHub Pages (static hosting)

## 🔐 Default Credentials

### Admin Account
- **Email**: `admin@sambadh.ai`
- **Password**: `admin123`

### Demo Business Account
- **Email**: `demo@sambadh.ai`
- **Password**: `demo123`

## 📁 Project Structure

```
sambadh-website/
├── index.html          # Main HTML file
├── app.js              # JavaScript with all logic
├── assets/
│   ├── logo.png        # Sambadh logo
│   └── favicon.png     # Favicon
└── README.md           # This file
```

## 🌐 GitHub Deployment Instructions

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `sambadh-website` (or any name you prefer)
3. Make it **Public**
4. Don't initialize with README (we already have files)

### Step 2: Upload Files

**Option A: Using GitHub Web Interface**
1. Click "uploading an existing file"
2. Drag and drop all files:
   - `index.html`
   - `app.js`
   - `README.md`
   - `assets/logo.png`
   - `assets/favicon.png`
3. Commit the files

**Option B: Using Git Command Line**
```bash
# Initialize git in your project folder
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Sambadh.ai website"

# Add remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll down to **Pages** section (left sidebar)
4. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes
7. Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### Step 4: Configure Custom Domain (sambadh.ai)

1. **Buy the domain** `sambadh.ai` from:
   - GoDaddy
   - Namecheap
   - Google Domains
   - Any domain registrar

2. **In your domain registrar's DNS settings**, add these records:

   **For root domain (sambadh.ai):**
   ```
   Type: A
   Host: @
   Value: 185.199.108.153
   
   Type: A
   Host: @
   Value: 185.199.109.153
   
   Type: A
   Host: @
   Value: 185.199.110.153
   
   Type: A
   Host: @
   Value: 185.199.111.153
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Host: www
   Value: YOUR_USERNAME.github.io
   ```

3. **In GitHub Pages settings**:
   - Under "Custom domain", enter: `sambadh.ai`
   - Check "Enforce HTTPS" (after DNS propagates)

4. **Wait for DNS propagation** (can take 24-48 hours)

5. Your site will be live at: `https://sambadh.ai`

## 📊 Data Management

### Storage
All data is stored in browser's localStorage:
- `sambadh_users` - All user accounts
- `sambadh_customers` - Customer database
- `sambadh_current_user` - Current logged-in user

### Export Data (Admin Only)
1. Login as admin
2. Open browser console (F12)
3. Run: `exportData()`
4. This downloads all data as JSON

### Backup & Restore
To backup: Use `exportData()` function
To restore: Import the JSON and update localStorage

## 🔒 Security Notes

**⚠️ IMPORTANT FOR PRODUCTION:**

This is a demo version using client-side storage. For production:

1. **Use a Real Database**:
   - Firebase (free tier available)
   - Supabase (PostgreSQL)
   - MongoDB Atlas
   - Or any backend service

2. **Add Password Hashing**:
   ```javascript
   // Use bcrypt or similar
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

3. **Add Authentication**:
   - JWT tokens
   - OAuth (Google/Facebook login)
   - Session management

4. **Environment Variables**:
   - Store admin credentials securely
   - Use .env files

5. **HTTPS Only**:
   - GitHub Pages provides free SSL
   - Enforce HTTPS in settings

## 🎨 Customization

### Change Colors
Edit CSS variables in `index.html`:
```css
:root {
    --orange: #FF5C00;
    --dark: #0D0D0F;
    /* ... modify as needed */
}
```

### Add Features
Edit `app.js` to add:
- More dashboard sections
- Additional user roles
- New business types
- Custom reports

## 📱 Responsive Design

The website is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px+)

## 🐛 Troubleshooting

### Website not loading on GitHub Pages?
- Check if `index.html` is in root directory
- Verify GitHub Pages is enabled
- Clear browser cache

### Custom domain not working?
- Wait 24-48 hours for DNS propagation
- Check DNS records are correct
- Verify CNAME file exists in repo

### Data not persisting?
- Check browser's localStorage isn't disabled
- Try different browser
- Check browser console for errors

## 📈 Future Enhancements

Based on the market research:

**Phase 1 (Q1 2026)**:
- [ ] QR Code generator
- [ ] WhatsApp Business API integration
- [ ] Hindi language UI
- [ ] Appointment booking module
- [ ] Google Review automation

**Phase 2 (Q2-Q3 2026)**:
- [ ] AI WhatsApp booking bot
- [ ] Referral program
- [ ] Digital loyalty cards
- [ ] Campaign analytics

**Phase 3 (Q4 2026+)**:
- [ ] Multi-location support
- [ ] POS integrations
- [ ] Revenue insights dashboard
- [ ] Mobile app (React Native)

## 📞 Support

For questions or issues:
- **Email**: admin@sambadh.ai
- **Location**: Jaipur, Rajasthan, India

## 📄 License

© 2026 Sambadh.ai - All Rights Reserved

---

**Built with ❤️ in Jaipur for Indian Small Businesses**

**Target**: 1,50,000 customers · ₹120 Crore ARR by Year 4
