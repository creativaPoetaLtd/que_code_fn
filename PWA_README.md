# QueCode PWA - Progressive Web App

Your QueCode app has been successfully converted to a Progressive Web App (PWA)! 🎉

## ✨ Features Added

- 📱 **Installable on Mobile & Desktop** - Users can install the app like a native app
- 🔄 **Offline Support** - App works even without internet connection
- ⚡ **Fast Performance** - Cached assets load instantly
- 📲 **App-like Experience** - Full-screen mode without browser UI
- 🔔 **Push Notifications Ready** - Foundation for real-time notifications

## 🚀 How to Install (For Users)

### On Android/Chrome:
1. Visit your website
2. Look for the install prompt at the bottom of the screen
3. Tap "Install" or click the menu (⋮) → "Install app"
4. The app will be added to your home screen

### On iOS/Safari:
1. Visit your website in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### On Desktop:
1. Visit your website in Chrome/Edge
2. Look for the install icon (⊕) in the address bar
3. Click "Install" when prompted

## 📱 What's Included

### PWA Configuration
- ✅ `manifest.json` - App manifest with metadata
- ✅ Service Worker - Auto-generated for caching
- ✅ Offline fallback page
- ✅ Install prompt component
- ✅ App icons (placeholders - see below)

### Caching Strategy
- **Static assets**: Images, fonts, CSS, JS (cached for fast loading)
- **API calls**: Network-first with fallback (always fresh when online)
- **Pages**: Stale-while-revalidate (instant load + background update)

## 🎨 TODO: Replace Icons

The app currently uses placeholder icons. Replace these with your actual app icons:

```bash
public/
├── icon-72x72.png       # Replace with your 72x72 icon
├── icon-96x96.png       # Replace with your 96x96 icon
├── icon-128x128.png     # Replace with your 128x128 icon
├── icon-144x144.png     # Replace with your 144x144 icon
├── icon-152x152.png     # Replace with your 152x152 icon
├── icon-192x192.png     # Replace with your 192x192 icon
├── icon-384x384.png     # Replace with your 384x384 icon
└── icon-512x512.png     # Replace with your 512x512 icon
```

**Quick way to generate icons:**
1. Create a 512x512 PNG logo
2. Use a tool like [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
3. Replace all icon files in `public/` folder

## 🧪 Testing Your PWA

### Local Testing:
```bash
# Build the app
pnpm run build

# Start production server
pnpm start

# Visit http://localhost:3000
# Open DevTools → Application → Manifest to see PWA details
```

### PWA Audit:
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Check "Progressive Web App"
4. Click "Generate report"
5. Aim for 90+ score

### Test Install:
1. Build and run production mode
2. Visit localhost:3000
3. Look for install prompt
4. Install and test offline mode

## 📊 PWA Features Checklist

- ✅ Manifest file
- ✅ Service worker
- ✅ HTTPS (required for production)
- ✅ Responsive design
- ✅ Offline fallback
- ✅ App icons
- ⏳ Push notifications (can be added)
- ⏳ Background sync (can be added)
- ⏳ Share API integration (can be added)

## 🔧 Configuration Files

### `next.config.mjs`
Contains PWA configuration including:
- Cache strategies
- Service worker settings
- Runtime caching rules

### `public/manifest.json`
App metadata including:
- App name and description
- Theme colors
- Icons
- Display mode
- Start URL

### `components/PWAInstallPrompt.tsx`
Custom install prompt that shows when app is installable

## 📝 Notes

- PWA only works in **production mode** (`pnpm build && pnpm start`)
- Service workers don't run in development mode
- HTTPS is required for PWA features in production
- Clear browser cache if you update the service worker

## 🚀 Deployment

When deploying:
1. Ensure your hosting supports HTTPS
2. Build the app: `pnpm build`
3. Deploy the `.next` folder
4. Test installation on real devices

## 🆘 Troubleshooting

**Install prompt not showing?**
- Make sure you're in production mode
- Clear browser cache
- Check DevTools → Application → Manifest for errors

**Offline mode not working?**
- Service worker must be registered (check DevTools → Application → Service Workers)
- Wait a few seconds after first visit
- Try closing and reopening the app

**Changes not reflecting?**
- Clear cache: DevTools → Application → Storage → Clear site data
- Rebuild: `pnpm build`

## 🎯 Next Steps

1. **Replace placeholder icons** with your brand logo
2. **Test on real devices** (Android, iOS)
3. **Add push notifications** (if needed)
4. **Optimize caching** based on your API needs
5. **Submit to app stores** (optional, using PWABuilder)

---

**Your app is now installable! 🎉**

Users can add it to their home screen and use it like a native app.
