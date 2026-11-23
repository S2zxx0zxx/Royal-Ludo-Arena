# Android Java AAB route

Web core: native browser PWA with HTML/CSS/JS. Android wrapper (later): Bubblewrap-generated Java-based Trusted Web Activity (TWA). No Kotlin files are required. TWA displays the deployed HTTPS origin and verifies ownership through Digital Asset Links. **AAB not yet created.**

Before packaging: register domain and HTTPS deployment, add working PWA manifest and compliant icons/splash, choose unique Android application ID, use JDK + Android SDK/Bubblewrap, generate signing key and preserve it securely, serve assetlinks.json, build signed .aab, test on actual Android devices, and satisfy Google Play review and policy requirements. This repo is currently only a frontend preview; no promise of offline-first TWA until verified.
