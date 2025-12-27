import { Shield, Users, Award, Globe } from 'lucide-react'

export function TrustBadges() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Shield className="w-5 h-5 text-emerald-600" />
        Why Trust Us?
      </h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">5000+ Happy Customers</p>
            <p className="text-sm text-slate-600">Trusted by gamers nationwide</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Official Distributor</p>
            <p className="text-sm text-slate-600">Authorized game code supplier</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Worldwide Service</p>
            <p className="text-sm text-slate-600">Serving customers globally</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-sm text-slate-600 mb-3">Accepted Payment Methods:</p>
        <div className="flex flex-wrap gap-2">
          {['Esewa', 'Khalti', 'IME Pay', 'Bank Transfer', 'Wallet'].map((method) => (
            <span 
              key={method}
              className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}