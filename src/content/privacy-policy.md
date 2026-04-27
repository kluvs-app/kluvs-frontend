# Privacy Policy

**Effective Date:** February 21, 2026.

Welcome to Kluvs! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (Android and iOS) and our Discord companion bot (collectively, the "Service"). 

Please read this Privacy Policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Service.

## 1. Information We Collect

We collect information about you directly from you, from third parties, and automatically through your use of Kluvs.

### A. Account and Profile Data
When you register for Kluvs, we collect information used to identify you and set up your profile:
* **Authentication Data:** We use Supabase Auth to manage user identities. Upon signing up, we derive a display name based on your authentication metadata or email prefix. 
* **Profile Customization:** We collect your chosen handle (username) and profile avatar images, which are stored securely in our cloud buckets.

### B. Discord Integration Data
To provide our cross-platform book club services, we integrate with Discord communities. We collect:
* **Server and Channel Information:** Discord Server IDs (snowflakes), Server Names, and Channel IDs to manage club spaces.
* **User Identity:** Discord User IDs and handles to link your Discord activity with your Kluvs web/mobile identity.

### C. App Activity and Reading Data
We store data regarding your participation within Kluvs, including:
* **Club Memberships:** Which clubs you have joined, your role (owner, admin, or member), and the date clubs were founded.
* **Reading Progress:** The number of books you have read, session due dates, and discussion locations.
* **Participation Tracking (ShameList):** We maintain a club-wide list tracking members who have not completed their assigned reading sessions.

### D. Device and Diagnostic Data
To ensure the stability and performance of our applications, we automatically collect diagnostic information when you use Kluvs or experience a crash:
* **Crash Reports and Error Logs:** Details about the code state at the time of an error.
* **Device Information:** Device model, operating system version, and general network information (such as IP addresses).

## 2. How We Use Your Information

We use the data we collect for the following purposes:
* **To Provide the Service:** To synchronize your reading sessions, book clubs, and member profiles seamlessly between our mobile apps and Discord servers.
* **To Manage Communities:** To enforce roles (e.g., owner, admin) within clubs and associate specific reading sessions and discussions with the correct Discord channels.
* **To Fetch Book Metadata:** We use the Google Books API to look up book details (titles, authors, cover images, page counts, and ISBNs) using external search data.
* **To Improve App Stability:** We analyze crash reports and diagnostic data to identify bugs, fix errors, and improve the overall performance of the Service.

## 3. Third-Party Service Providers

We rely on trusted third-party services to power Kluvs. We share necessary data with these providers strictly to facilitate our services:
* **Supabase:** We use Supabase as our Backend-as-a-Service to manage database hosting, real-time data syncing, user authentication, and avatar image storage.
* **Discord:** We utilize Discord's API to run our companion bot and sync book clubs to specific servers and channels.
* **Google Books:** We fetch and cache book cover URLs and metadata from the Google Books API.
* **Sentry:** We use Sentry for error tracking and crash reporting. Sentry processes diagnostic data and error logs to help us identify and resolve software bugs.

## 4. Data Security and Retention

Your data is stored securely using industry-standard cloud infrastructure. We retain personal information only for as long as is necessary for the purposes set out in this Privacy Policy.

**Data Deletion:** If you choose to delete your account or if your member record is removed, our systems automatically trigger a cleanup process that permanently deletes your avatar image and personal records from our databases and storage buckets. 

## 5. Your Rights

Depending on your location, you may have the following rights regarding your personal data:
* The right to access the data we have collected about you.
* The right to request the deletion of your account, which will sever your link from Discord and remove your avatar, profile data, and reading history.
* The right to correct inaccurate profile information through the Kluvs app.

## 6. Contact Us

If you have questions or comments about this Privacy Policy, please contact us at:

**Ivan Garza** [kluvs-app@gmail.com](mailto:kluvs-app@gmail.com)