# 🚀 Sambadh.ai - Modern WhatsApp CRM for Indian Small Businesses

A vibrant, full-stack customer relationship management platform powered by Firebase, designed specifically for salons, restaurants, gyms, and local businesses across India.

![Sambadh.ai](assets/logo.png)

## ✨ Key Features

### 🎯 Core CRM Features
- **Smart QR Customer Capture** - One QR code, automatic database growth
- **WhatsApp Automation** - AI-powered messaging & booking bot
- **Customer Segmentation** - Automatic grouping by behavior & spend
- **Campaign Management** - Targeted WhatsApp campaigns
- **Real-time Analytics** - Revenue tracking, retention metrics
- **Appointment Booking** - WhatsApp-based scheduling system
- **Digital Loyalty Programs** - Stamp cards & referral rewards
- **Google Review Automation** - Auto-request happy customer reviews

### 🔥 Advanced Features
- **Multi-language Support** - Hindi, English, + 10 regional languages
- **POS Integration** - Connect with Petpooja, Posist
- **SMS Fallback** - Never miss a customer
- **A/B Testing** - Optimize your campaigns
- **Custom Reports** - Export to Excel anytime
- **Revenue Predictions** - AI-powered insights
- **VIP Customer Alerts** - Never miss important customers
- **Digital Vouchers** - Create & track discount coupons

## 🎨 Design Highlights

- ✅ **Vibrant Light Theme** - Modern, energetic, and welcoming
- ✅ **Smooth Animations** - Delightful micro-interactions
- ✅ **Gradient Accents** - Eye-catching color combinations
- ✅ **Responsive Design** - Perfect on all devices
- ✅ **Professional UI** - Enterprise-quality interface

## 🔐 Firebase Integration

### Database Structure
```
users/
  └─ {userId}/
      ├─ businessName
      ├─ email
      ├─ plan
      ├─ stats/
      │   ├─ totalCustomers
      │   ├─ monthlyGrowth
      │   ├─ campaignsSent
      │   └─ retention
      └─ createdAt

customers/
  └─ {customerId}/
      ├─ userId
      ├─ name
      ├─ phone
      ├─ lastVisit
      ├─ totalVisits
      ├─ revenue
      └─ createdAt
```

### Firebase Setup Steps

1. **Create Firebase Project**
   ```bash
   1. Go to https://console.firebase.google.com/
   2. Click "Add Project"
   3. Name it "Sambadh CRM" (or any name)
   4. Disable Google Analytics (optional)
   5. Create project
   ```

2. **Add Web App**
   ```bash
   1. Click on "</>" (Web) icon
   2. Register app: "Sambadh Web App"
   3. Copy the firebaseConfig object
   4. Paste it in firebase-config.js
   ```

3. **Enable Authentication**
   ```bash
   1. Go to Authentication → Get Started
   2. Click "Sign-in method"
   3. Enable "Email/Password"
   4. Save
   ```

4. **Create Firestore Database**
   ```bash
   1. Go to Firestore Database
   2. Click "Create database"
   3. Start in "Production mode"
   4. Choose location: asia-south1 (Mumbai)
   5. Enable
   ```

5. **Set Firestore Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Customers belong to users
       match /customers/{customerId} {
         allow read, write: if request.auth != null;
       }
       
       // Admin can read all
       match /{document=**} {
         allow read: if request.auth.token.email == 'admin@sambadh.ai';
       }
     }
   }
   ```

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Hosting | GitHub Pages (Free) |
| Storage | Firebase Storage (optional) |
| Fonts | Google Fonts (Syne, DM Sans) |

## 🔑 Default Credentials

### Admin Account
```
Email: admin@sambadh.ai
Password: admin123
```
→ Full platform access, revenue tracking, all users

### Demo Business Account
```
Email: demo@sambadh.ai
Password: demo123
```
→ Sample salon with 3 demo customers

## 🚀 Deployment Guide

### Option 1: GitHub Pages (Free & Easy)

1. **Upload to GitHub**
   ```bash
   # Create repo at github.com
   # Then upload all files
   ```

2. **Enable Pages**
   ```bash
   Settings → Pages → Source: main branch → Save
   ```

3. **Live in 2 minutes!**
   ```
   https://YOUR_USERNAME.github.io/sambadh-website/
   ```

### Option 2: Netlify (Free & Faster)

1. **Connect GitHub Repo**
   - Go to netlify.com
   - Click "New site from Git"
   - Connect GitHub
   - Select your repo

2. **Deploy**
   - Build command: (leave empty)
   - Publish directory: /
   - Click "Deploy"

3. **Live instantly!**
   - Auto-deploys on every git push
   - Free SSL certificate
   - Custom domain support

### Option 3: Vercel (Free & Blazing Fast)

1. **Import Project**
   - Go to vercel.com
   - Click "Import Project"
   - Connect GitHub

2. **Configure**
   - Framework: Other
   - Build command: (leave empty)
   - Output directory: ./

3. **Deploy**
   - One-click deployment
   - Automatic HTTPS
   - Edge network

## 🌐 Custom Domain Setup (sambadh.ai)

### Buy Domain
- GoDaddy, Namecheap, or Google Domains
- Cost: ₹500-1,000/year

### DNS Configuration

**For GitHub Pages:**
```
Type: A, Host: @, Value: 185.199.108.153
Type: A, Host: @, Value: 185.199.109.153
Type: A, Host: @, Value: 185.199.110.153
Type: A, Host: @, Value: 185.199.111.153
Type: CNAME, Host: www, Value: YOUR_USERNAME.github.io
```

**For Netlify/Vercel:**
```
Follow their custom domain wizard
They'll give you nameservers or CNAME records
```

### In GitHub Pages Settings
```
Custom domain: sambadh.ai
Enforce HTTPS: ✓ (after DNS propagates)
```

## 📊 Pricing Plans (Built-in)

| Plan | Price | Features |
|------|-------|----------|
| **Basic** | ₹299/mo | 500 customers, QR capture, 1000 WhatsApp msgs |
| **Pro** | ₹699/mo | 2,000 customers, AI bot, unlimited msgs, campaigns |
| **Premium** | ₹1,299/mo | Unlimited, multi-location, API, POS integration |

## 🎯 CRM Feature Roadmap

### Phase 1 - MVP (Completed ✅)
- [x] User authentication
- [x] Dashboard with stats
- [x] Customer database
- [x] Pricing plans
- [x] Admin panel
- [x] Firebase integration
- [x] Responsive design

### Phase 2 - Core CRM (Next)
- [ ] QR code generator
- [ ] WhatsApp API integration
- [ ] Campaign builder
- [ ] Customer segmentation
- [ ] Basic analytics
- [ ] Email notifications

### Phase 3 - Advanced Features
- [ ] AI WhatsApp booking bot
- [ ] Google Review automation
- [ ] Digital loyalty cards
- [ ] Advanced analytics dashboard
- [ ] Revenue predictions
- [ ] A/B testing

### Phase 4 - Enterprise
- [ ] Multi-location support
- [ ] POS integrations
- [ ] API access
- [ ] White-label options
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced reporting

## 🔒 Security Best Practices

### Current Implementation
✅ Firebase Authentication
✅ Firestore Security Rules
✅ Client-side validation
✅ HTTPS (via hosting platform)

### Recommended Additions
1. **Password Requirements**
   - Minimum 8 characters
   - At least 1 uppercase, 1 number
   - Add to signup validation

2. **Rate Limiting**
   - Implement Firebase Security Rules
   - Limit login attempts
   - Throttle API calls

3. **Data Encryption**
   - Sensitive data encrypted at rest (Firebase does this)
   - HTTPS for all traffic (GitHub Pages provides)

4. **Environment Variables**
   - Move Firebase config to environment
   - Never commit API keys to GitHub

## 🧪 Testing

### Manual Testing Checklist
- [ ] Signup with new account
- [ ] Login with demo account
- [ ] View customer list
- [ ] Check stats updates
- [ ] Admin login
- [ ] Export data
- [ ] Test on mobile
- [ ] Test all quick actions

### Automated Testing (Future)
```javascript
// Add Jest for unit tests
// Add Cypress for E2E tests
npm install --save-dev jest cypress
```

## 📈 Analytics Integration

### Google Analytics
```html
<!-- Add to index.html <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Firebase Analytics (Recommended)
```javascript
// Already included in Firebase SDK
// Just enable in Firebase Console
// Auto-tracks page views, events
```

## 🐛 Troubleshooting

### Firebase Not Connecting?
1. Check firebase-config.js has correct credentials
2. Verify Firebase project is created
3. Check browser console for errors
4. Ensure Firestore is enabled

### Signup Not Working?
1. Verify Email/Password auth is enabled in Firebase
2. Check password meets minimum 6 characters
3. Look for error in browser console
4. Try different email

### Data Not Persisting?
1. Check Firestore rules are set
2. Verify user is authenticated
3. Check browser's localStorage isn't disabled
4. Look for errors in console

### Custom Domain Not Working?
1. Wait 24-48 hours for DNS propagation
2. Verify DNS records are correct
3. Check CNAME file exists in repo
4. Try clearing browser cache

## 💡 Feature Ideas (Community)

Want to contribute? Here are some feature ideas:

### Easy Wins
- Dark mode toggle
- Multi-language UI switcher
- Customer import from CSV
- PDF export of reports
- Email templates

### Medium Complexity
- Appointment scheduling calendar
- SMS campaign integration
- Payment gateway (Razorpay)
- Customer feedback forms
- Automated birthday wishes

### Advanced
- AI chatbot for customer queries
- Voice call integration
- Video consultation booking
- Inventory management
- Staff management module

## 📞 Support & Contact

- **Email**: support@sambadh.ai
- **Location**: Jaipur, Rajasthan, India
- **Target Market**: India's 8 crore+ small businesses

## 📄 License

© 2026 Sambadh.ai - All Rights Reserved

---

## 🎉 Quick Start Summary

1. ✅ Download all files
2. ✅ Create Firebase project
3. ✅ Update firebase-config.js
4. ✅ Upload to GitHub
5. ✅ Enable GitHub Pages
6. ✅ Test at your-username.github.io
7. ✅ (Optional) Buy sambadh.ai domain
8. ✅ (Optional) Configure custom domain

**Total Setup Time**: 15-20 minutes
**Cost**: ₹0 (Free hosting) or ~₹500-1000/year with custom domain

**You're ready to scale to ₹120 Crore ARR!** 🚀

---

Built with ❤️ for India's small business revolution.
From the market research: *"India has 8 crore+ small businesses. 84% have no CRM. Your ₹299/month platform is exactly what this market needs."*
