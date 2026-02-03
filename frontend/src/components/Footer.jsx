import { Link } from 'react-router-dom'
import { Linkedin, Github, Mail, Twitter } from 'lucide-react'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    /* Changed bg-white to bg-muted for a soft "Ice Blue" finish */
    <footer className="bg-muted border-t border-border mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* About */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-4">About PlaceHub</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              PlaceHub is a comprehensive placement portal designed to help students prepare for their campus placements and share valuable experiences with peers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/experiences" className="text-muted-foreground hover:text-secondary text-sm font-medium transition-colors">
                  Experiences
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="text-muted-foreground hover:text-secondary text-sm font-medium transition-colors">
                  Opportunities
                </Link>
              </li>
              <li>
                <Link to="/mentorship" className="text-muted-foreground hover:text-secondary text-sm font-medium transition-colors">
                  Mentorship
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-muted-foreground hover:text-secondary text-sm font-medium transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-4">Contact</h3>
            <ul className="space-y-3 text-muted-foreground text-sm font-medium">
              <li className="flex items-center gap-2">
                <span className="text-accent">Email:</span> admin@placehub.com
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">Phone:</span> +91 (555) 123-4567
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">Location:</span> India
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-4">Follow Us</h3>
            <div className="flex gap-3">
              {/* Used Primary (Navy) for icons, Secondary (Teal) for hover */}
              {[
                { Icon: Linkedin, href: "#" },
                { Icon: Github, href: "#" },
                { Icon: Twitter, href: "#" },
                { Icon: Mail, href: "#" }
              ].map(({ Icon, href }, index) => (
                <a
                  key={index}
                  href={href}
                  className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-secondary transition-all shadow-md hover:-translate-y-1"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
            © {currentYear} PlaceHub. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary font-bold transition-colors">PRIVACY POLICY</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary font-bold transition-colors">TERMS OF SERVICE</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer