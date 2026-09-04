import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ViewState } from '../types';

interface InfoViewProps {
  pageId: string;
  onNavigate: (view: ViewState) => void;
  onGoBack?: () => void;
}

const pageContent: Record<string, { title: string; content: React.ReactNode }> = {
  'about': {
    title: 'About Spotiz',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Spotiz is a modern, high-fidelity music streaming platform designed to bring you closer to the music you love.</p>
        <p>Our mission is to create a seamless, immersive, and high-performance audio experience for everyone, everywhere.</p>
        <p>Features include:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ad-free premium playback</li>
          <li>Offline listening</li>
          <li>High-fidelity audio quality</li>
          <li>Cross-device synchronization</li>
        </ul>
        <p>We envision a world where music flows effortlessly into your life, enhancing every moment with the perfect soundtrack.</p>
      </div>
    )
  },
  'jobs': {
    title: 'Jobs & Careers',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Join the band! We're always looking for passionate engineers, designers, and music lovers to help us build the future of audio.</p>
        <p>Current open positions include:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Frontend Engineer (React/TypeScript)</li>
          <li>Backend Audio Engineer (Go/Node.js)</li>
          <li>Product Designer (UI/UX)</li>
          <li>Music Curation Specialist</li>
        </ul>
        <p>We offer competitive salaries, excellent benefits, and a culture that celebrates creativity and diversity.</p>
      </div>
    )
  },
  'for-the-record': {
    title: 'For the Record',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Welcome to our official newsroom.</p>
        <p>Here you will find the latest announcements, feature releases, and stories from the team behind Spotiz.</p>
        <p>Stay tuned for exciting updates on upcoming artist partnerships and new platform features.</p>
      </div>
    )
  },
  'for-artists': {
    title: 'For Artists',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Empower your music career with Spotiz for Artists.</p>
        <p>We provide the tools you need to understand your audience, promote your music, and connect with fans around the world.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Detailed streaming analytics</li>
          <li>Profile customization</li>
          <li>Pitch your upcoming releases</li>
          <li>Merch integration</li>
        </ul>
      </div>
    )
  },
  'developers': {
    title: 'Developers',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Build the future of audio with the Spotiz API.</p>
        <p>Our comprehensive developer platform allows you to integrate Spotiz playback, search, and user libraries directly into your applications.</p>
        <p>Currently in private beta. SDKs available for Web, iOS, and Android.</p>
      </div>
    )
  },
  'advertising': {
    title: 'Advertising',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Reach millions of engaged listeners with Spotiz Ads.</p>
        <p>Whether you are a global brand or a local business, our targeted audio and display advertising solutions help you connect with the right audience at the right time.</p>
        <p>Contact our sales team to launch your campaign today.</p>
      </div>
    )
  },
  'investors': {
    title: 'Investors',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Spotiz is a privately held company focused on long-term growth and innovation in the audio streaming market.</p>
        <p>For financial reports, quarterly updates, and investor relations contact information, please reach out to our IR department.</p>
      </div>
    )
  },
  'vendors': {
    title: 'Partners & Vendors',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>We collaborate with industry-leading technology and content partners to deliver a world-class streaming experience.</p>
        <p>If you represent a record label, distributor, or technology provider, we would love to hear from you.</p>
      </div>
    )
  },
  'support': {
    title: 'Support',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>How can we help you today?</p>
        <p className="font-semibold text-white mt-4">Common Issues:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Reset your password</li>
          <li>Manage your subscription</li>
          <li>Troubleshoot playback issues</li>
          <li>Restore missing playlists</li>
        </ul>
        <p className="mt-4">For immediate assistance, please contact our 24/7 support team via email or live chat.</p>
      </div>
    )
  },
  'get-app': {
    title: 'Get the Mobile App',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Take your music everywhere with the Spotiz mobile app.</p>
        <p>Available on both iOS and Android, our mobile application offers exclusive features like offline downloading, high-quality streaming on the go, and seamless integration with your car audio systems.</p>
        <p>Search for "Spotiz" in your device's app store to download it for free.</p>
      </div>
    )
  },
  'country': {
    title: 'Music by Country',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Discover the sounds of the world.</p>
        <p>Explore localized charts, curated playlists, and top trending artists tailored to different regions across the globe.</p>
        <p>From K-Pop in South Korea to Afrobeats in Nigeria, expand your musical horizons.</p>
      </div>
    )
  },
  'import': {
    title: 'Import Your Music',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Moving from another service? We make it easy to bring your library with you.</p>
        <p>Our secure import tool allows you to seamlessly transfer your saved tracks, albums, and carefully curated playlists from other major streaming platforms directly into your Spotiz account.</p>
        <p>Start the import process in your Account Settings.</p>
      </div>
    )
  },
  'premium-standard': {
    title: 'Premium Standard Plan',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>The ultimate audio experience for dedicated music fans.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ad-free music listening</li>
          <li>Play anywhere - even offline</li>
          <li>On-demand playback</li>
          <li>High fidelity (320kbps) audio quality</li>
        </ul>
        <p>Unlock the full potential of Spotiz for one low monthly price.</p>
      </div>
    )
  },
  'premium-student': {
    title: 'Premium Student Plan',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>All the benefits of Premium Standard, but at a discounted rate for eligible university students.</p>
        <p>Requires annual verification of student status through a supported verification service.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Ad-free music listening</li>
          <li>Play anywhere - even offline</li>
          <li>On-demand playback</li>
        </ul>
      </div>
    )
  },
  'premium-free': {
    title: 'Free Plan',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Enjoy millions of songs and podcasts for free, supported by occasional advertisements.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Shuffle play on mobile</li>
          <li>Basic audio quality</li>
          <li>Ad-supported listening experience</li>
        </ul>
        <p>Upgrade to Premium at any time to remove ads and unlock offline listening.</p>
      </div>
    )
  },
  'legal': {
    title: 'Legal Information',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Review our Terms and Conditions of Use.</p>
        <p>These terms govern your use of the Spotiz service, software applications, and websites.</p>
        <p>By continuing to use our services, you agree to be bound by these guidelines and agreements.</p>
      </div>
    )
  },
  'safety': {
    title: 'Safety & Privacy Center',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>Your security and privacy are our top priorities.</p>
        <p>Learn how we protect your personal information, manage account security, and provide tools to control your data and privacy preferences.</p>
      </div>
    )
  },
  'privacy': {
    title: 'Privacy Policy',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>This Privacy Policy describes how we collect, use, and share your personal data.</p>
        <p>We believe in transparency and want you to understand what data we collect, why we collect it, and what we do with it to provide and improve our services.</p>
      </div>
    )
  },
  'cookies': {
    title: 'Cookies Policy',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>We use cookies and similar tracking technologies to improve your experience, analyze traffic, and personalize content and ads.</p>
        <p>This policy explains the types of cookies we use and how you can manage your preferences.</p>
      </div>
    )
  },
  'ads': {
    title: 'About Ads',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>To keep our free tier available to everyone, we show advertisements.</p>
        <p>We strive to make ads relevant and unobtrusive. Learn more about how ads are selected for you and how you can manage your ad preferences.</p>
      </div>
    )
  },
  'accessibility': {
    title: 'Accessibility',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>We are committed to making our platform accessible to everyone, including individuals with disabilities.</p>
        <p>We continually work to improve the usability of our app and website, adhering to established accessibility guidelines and standards.</p>
      </div>
    )
  },
  'not-found': {
    title: 'Page Not Found',
    content: (
      <div className="space-y-6 text-neutral-300">
        <p>The information you are looking for could not be found.</p>
      </div>
    )
  }
};

export const InfoView: React.FC<InfoViewProps> = ({ pageId, onNavigate, onGoBack }) => {
  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      onNavigate({ type: 'home' });
    }
  };

  const page = pageContent[pageId] || pageContent['not-found'];

  return (
    <div className="relative min-h-full bg-neutral-900/40 flex flex-col pb-24">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 sm:px-6 sm:py-5 flex items-center sticky top-0 z-10 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer mr-3"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide truncate">
          {page.title}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 sm:p-8 md:p-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
            {page.title}
          </h2>
          
          <div className="prose prose-invert max-w-none text-base sm:text-lg leading-relaxed text-neutral-300 font-medium">
            {page.content}
          </div>
          
          {/* Default back button at the bottom for convenience */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <button
              onClick={handleBack}
              className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
