import Link from 'next/link'
import { Button } from '@/components/ui'
import { 
  MapPinIcon, 
  CalculatorIcon, 
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

/**
 * Landing page component showcasing the roof calculator features
 * Optimized for SEO and user engagement
 */
export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Calculate Roof Areas
            <span className="block text-blue-200">with Precision</span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Professional-grade roof area measurement using satellite imagery and advanced mapping technology. 
            Get accurate measurements in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote-calculator">
              <Button size="lg" className=" px-8 py-4 text-lg font-semibold shadow-lg">
                Start Calculating
                <CalculatorIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose LuxeIQ?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Industry-leading tools designed for professionals who demand accuracy and efficiency
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold">{stat.value}</div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of professionals who trust LuxeIQ for accurate roof measurements
        </p>
        
        <Link href="/quote-calculator">
          <Button size="lg" className="px-8 py-4 text-lg font-semibold shadow-lg">
            Start Your First Calculation
            <MapPinIcon className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
  )
}

/**
 * Feature card component for displaying individual features
 */
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

// Feature data for the features section
const features = [
  {
    icon: MapPinIcon,
    title: "Satellite Precision",
    description: "Access high-resolution satellite imagery to accurately trace roof boundaries with sub-meter precision."
  },
  {
    icon: CalculatorIcon,
    title: "Instant Calculations",
    description: "Get immediate area measurements in square feet with automatic conversion and detailed breakdowns."
  },
  {
    icon: ChartBarIcon,
    title: "Professional Reports",
    description: "Generate detailed reports with measurements, calculations, and visual documentation for clients."
  },
  {
    icon: ClockIcon,
    title: "Time Efficient",
    description: "Complete roof measurements in minutes instead of hours, saving valuable time on every project."
  },
  {
    icon: ShieldCheckIcon,
    title: "Industry Accurate",
    description: "Meet industry standards with calculations verified by construction professionals and engineers."
  },
  {
    icon: CubeIcon,
    title: "3D Visualization",
    description: "View properties in 3D perspective to better understand roof structures and complex geometries."
  }
]

// Statistics data
const stats = [
  { value: "50,000+", label: "Roofs Measured" },
  { value: "99.5%", label: "Accuracy Rate" },
  { value: "5,000+", label: "Happy Customers" }
]