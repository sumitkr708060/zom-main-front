import { Link } from 'react-router-dom';

const infoLinks = [
  ['About Us', '/about'],
  ['FAQs', '/faqs'],
  ['Privacy Policy', '/privacy'],
  ['Return & Refund Policy', '/returns'],
  ['Shipping Policy', '/shipping'],
  ['Terms & Conditions', '/terms'],
  ['Trade-In Policy', '/trade-in'],
  ['Contact Us', '/contact'],
];

const socials = [
  ['Facebook', 'https://facebook.com'],
  ['Instagram', 'https://instagram.com'],
  ['X (Twitter)', 'https://twitter.com'],
  ['YouTube', 'https://youtube.com'],
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-gradient-to-b from-[#0d0f13] via-[#0b0d11] to-[#090b0f] text-gray-100 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 text-center lg:text-left">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <img src="/logo.svg" alt="Zomitron" className="h-10 w-auto filter drop-shadow-lg" />
              <span className="text-2xl font-bold text-cyan-300 drop-shadow">ZOMITRON</span>
            </div>
            <p className="text-base sm:text-lg leading-7 text-gray-200">
              Quick-commerce marketplace for electronics, appliances, furniture, fashion, kitchen & home items, baby & kids,
              auto accessories, sports, books and more. Same-day or fast delivery in supported Indian cities.
            </p>
            <p className="text-sm text-gray-400">© 2026 Zomitron. All rights reserved.</p>
          </div>

          {/* Information */}
          <div className="space-y-4">
            <h3 className="text-cyan-300 text-2xl font-bold drop-shadow">INFORMATION</h3>
            <div className="flex flex-col gap-2 text-base sm:text-lg text-gray-100">
              {infoLinks.map(([label, href]) => (
                <Link key={href} to={href} className="hover:text-cyan-200 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Stay connected */}
          <div className="space-y-4">
            <h3 className="text-cyan-300 text-2xl font-bold drop-shadow">STAY CONNECTED</h3>
            <div className="flex flex-col gap-2 text-base sm:text-lg text-gray-100">
              {socials.map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noreferrer" className="hover:text-cyan-200 transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact + Payments */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="space-y-2">
              <h3 className="text-cyan-300 text-2xl font-bold drop-shadow">CONTACT US</h3>
              <p className="text-base sm:text-lg text-gray-100">Phone: +91 6393200000</p>
              <p className="text-base sm:text-lg text-gray-100">Email: support@zomitron.com</p>
              <p className="text-base sm:text-lg text-gray-100">Support: Mon–Sat, 11:00 AM – 7:00 PM</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-cyan-300 text-2xl font-bold drop-shadow">PAYMENT METHODS</h3>
              <p className="text-base sm:text-lg text-gray-100">UPI · Credit/Debit Cards · Wallets · Cash on Delivery*</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
