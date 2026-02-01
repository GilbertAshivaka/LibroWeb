import { Link } from 'react-router-dom'
import { BookOpen, Check, ArrowLeft, HelpCircle } from 'lucide-react'

const tiers = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small libraries',
    price: 299,
    period: 'year',
    features: [
      'Up to 10,000 catalog items',
      '3 staff accounts',
      'Basic cataloging (MARC21)',
      'Circulation management',
      'Patron registration',
      'Fine tracking',
      'Basic reports',
      'Email support',
    ],
    limitations: [
      'No multi-branch support',
      'Limited API access',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing libraries',
    price: 799,
    period: 'year',
    features: [
      'Up to 100,000 catalog items',
      '10 staff accounts',
      'Advanced cataloging',
      'Z39.50 copy cataloging',
      'MARC import/export',
      'Advanced circulation rules',
      'Custom reports builder',
      'Email notifications',
      'Priority support',
      'Basic API access',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large library networks',
    price: 1999,
    period: 'year',
    features: [
      'Unlimited catalog items',
      'Unlimited staff accounts',
      'Multi-branch support',
      'Full API access',
      'Custom integrations',
      'SSO/LDAP support',
      'White-label options',
      'On-site training',
      'Dedicated account manager',
      '24/7 phone support',
      'SLA guarantee',
    ],
    limitations: [],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

const faqs = [
  {
    question: 'How long is the free trial?',
    answer: 'All plans include a 30-day free trial with full access to all features. No credit card required to start.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan at any time. When upgrading, you\'ll get immediate access to additional features. When downgrading, changes take effect at the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfers, mobile money, and can arrange invoicing for enterprise customers. Contact our sales team for payment options in your region.',
  },
  {
    question: 'Is there a discount for annual billing?',
    answer: 'The prices shown are for annual billing. Monthly billing is available at a 20% premium. Multi-year agreements may qualify for additional discounts.',
  },
  {
    question: 'What happens when my subscription expires?',
    answer: 'Your data remains safe and accessible in read-only mode for 30 days after expiration. After renewing, full functionality is restored immediately.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'We offer a 30-day money-back guarantee for all new subscriptions. If you\'re not satisfied, contact support for a full refund.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-libro-cream-50">
      {/* Header */}
      <header className="bg-white border-b border-libro-warmgray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-libro-coral-400 to-libro-coral-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-libro-warmgray-800">Libro</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-libro-warmgray-600 hover:text-libro-coral-500">Home</Link>
              <Link to="/download" className="text-libro-warmgray-600 hover:text-libro-coral-500">Download</Link>
              <Link to="/portal/login" className="text-libro-warmgray-600 hover:text-libro-coral-500">Sign In</Link>
              <Link to="/register" className="btn-primary">Start Trial</Link>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-libro-warmgray-800 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-libro-warmgray-600 mb-8">
            Choose the plan that fits your library. All plans include a 30-day free trial.
          </p>
          <div className="inline-flex items-center gap-2 bg-libro-green-100 text-libro-green-700 px-4 py-2 rounded-full text-sm font-medium">
            <Check className="w-4 h-4" />
            No credit card required
          </div>
        </div>
      </section>
      
      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  tier.highlighted ? 'ring-2 ring-libro-coral-500' : ''
                }`}
              >
                {tier.badge && (
                  <div className="absolute top-0 right-0 bg-libro-coral-500 text-white px-4 py-1 text-sm font-medium rounded-bl-xl">
                    {tier.badge}
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-xl font-bold text-libro-warmgray-800">{tier.name}</h3>
                  <p className="text-libro-warmgray-500 text-sm mt-1">{tier.description}</p>
                  
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-libro-warmgray-800">${tier.price}</span>
                    <span className="text-libro-warmgray-500">/{tier.period}</span>
                  </div>
                  
                  <Link
                    to={`/register?plan=${tier.id}`}
                    className={`block w-full text-center py-3 rounded-xl font-medium mt-6 transition-colors ${
                      tier.highlighted
                        ? 'bg-libro-coral-500 text-white hover:bg-libro-coral-600'
                        : 'bg-libro-warmgray-100 text-libro-warmgray-700 hover:bg-libro-warmgray-200'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
                
                <div className="px-8 pb-8">
                  <p className="text-sm font-medium text-libro-warmgray-800 mb-4">What's included:</p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-libro-warmgray-600">
                        <Check className="w-4 h-4 text-libro-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {tier.limitations.length > 0 && (
                    <>
                      <p className="text-sm font-medium text-libro-warmgray-800 mt-6 mb-4">Limitations:</p>
                      <ul className="space-y-2">
                        {tier.limitations.map((limitation, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-libro-warmgray-500">
                            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">–</span>
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Feature Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-libro-warmgray-800 text-center mb-12">
            Compare Plans
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-libro-warmgray-200">
                  <th className="py-4 px-4 text-left text-libro-warmgray-800">Feature</th>
                  <th className="py-4 px-4 text-center text-libro-warmgray-800">Starter</th>
                  <th className="py-4 px-4 text-center text-libro-warmgray-800">Professional</th>
                  <th className="py-4 px-4 text-center text-libro-warmgray-800">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ['Catalog Items', '10,000', '100,000', 'Unlimited'],
                  ['Staff Accounts', '3', '10', 'Unlimited'],
                  ['MARC21 Support', true, true, true],
                  ['Z39.50 Copy Cataloging', false, true, true],
                  ['Multi-branch Support', false, false, true],
                  ['API Access', 'Limited', 'Basic', 'Full'],
                  ['Custom Reports', false, true, true],
                  ['Email Notifications', false, true, true],
                  ['SSO/LDAP', false, false, true],
                  ['Support', 'Email', 'Priority', '24/7 Phone'],
                ].map(([feature, starter, pro, enterprise], idx) => (
                  <tr key={idx} className="border-b border-libro-warmgray-100">
                    <td className="py-3 px-4 text-libro-warmgray-700">{feature}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof starter === 'boolean' ? (
                        starter ? <Check className="w-4 h-4 text-libro-green-500 mx-auto" /> : <span className="text-libro-warmgray-300">–</span>
                      ) : (
                        <span className="text-libro-warmgray-600">{starter}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center bg-libro-coral-50">
                      {typeof pro === 'boolean' ? (
                        pro ? <Check className="w-4 h-4 text-libro-green-500 mx-auto" /> : <span className="text-libro-warmgray-300">–</span>
                      ) : (
                        <span className="text-libro-warmgray-600">{pro}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof enterprise === 'boolean' ? (
                        enterprise ? <Check className="w-4 h-4 text-libro-green-500 mx-auto" /> : <span className="text-libro-warmgray-300">–</span>
                      ) : (
                        <span className="text-libro-warmgray-600">{enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-libro-warmgray-800 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-libro-coral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-libro-warmgray-800">{faq.question}</h3>
                    <p className="text-libro-warmgray-600 mt-2 text-sm">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-libro-coral-500 to-libro-coral-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Library?
          </h2>
          <p className="text-white/80 mb-8">
            Start your 30-day free trial today. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-libro-coral-500 hover:bg-libro-cream-50 px-8 py-3 rounded-xl font-medium transition-colors">
              Start Free Trial
            </Link>
            <a href="mailto:sales@libro.app" className="border border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-medium transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-libro-warmgray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-libro-coral-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Libro ILMS</span>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-libro-warmgray-400">
              <Link to="/" className="hover:text-white">Home</Link>
              <Link to="/pricing" className="hover:text-white">Pricing</Link>
              <Link to="/download" className="hover:text-white">Download</Link>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-libro-warmgray-700 text-center text-sm text-libro-warmgray-500">
            © {new Date().getFullYear()} Libro ILMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
