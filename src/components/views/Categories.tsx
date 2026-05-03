import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  Wrench,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  items: number;
  value: string;
  percentage: number;
  key?: React.Key;
}

const CategoryCard = ({ title, description, icon: Icon, color, items, value, percentage }: CategoryCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-[#F1F5F9] rounded-lg p-2.5 text-center">
          <p className="text-base sm:text-lg font-bold text-slate-900">{items.toLocaleString()}</p>
          <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium whitespace-nowrap">Items</p>
        </div>
        <div className="bg-[#F1F5F9] rounded-lg p-2.5 text-center">
          <p className="text-base sm:text-lg font-bold text-slate-900">{value}</p>
          <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium whitespace-nowrap">Value</p>
        </div>
        <div className="bg-[#F1F5F9] rounded-lg p-2.5 text-center">
          <p className="text-base sm:text-lg font-bold text-slate-900">{percentage}%</p>
          <p className="text-[11px] sm:text-[12px] text-slate-500 font-medium whitespace-nowrap">of Total</p>
        </div>
      </div>

      <button className="w-full mt-4 h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-wider">
        View All Items
      </button>
    </motion.div>
  );
};

export function Categories() {
  const { settings } = useSettings();
  const currency = settings?.currency || '$';

  const categories = [
    {
      title: 'Fast Moving',
      description: 'High demand items selling quickly',
      icon: TrendingUp,
      color: 'bg-[#22C55E]',
      items: 423,
      value: `${currency}312K`,
      percentage: 33
    },
    {
      title: 'Moderate',
      description: 'Steady sales performance',
      icon: BarChart3,
      color: 'bg-[#3B82F6]',
      items: 687,
      value: `${currency}298K`,
      percentage: 31
    },
    {
      title: 'Slow Moving',
      description: 'Low turnover, consider promotions',
      icon: Clock,
      color: 'bg-[#F59E0B]',
      items: 512,
      value: `${currency}198K`,
      percentage: 21
    },
    {
      title: 'Obsolete',
      description: 'No recent sales, clearance recommended',
      icon: AlertTriangle,
      color: 'bg-[#EF4444]',
      items: 225,
      value: `${currency}38K`,
      percentage: 4
    },
    {
      title: 'MRO',
      description: 'Maintenance, repair & operations consumables',
      icon: Wrench,
      color: 'bg-[#14B8A6]',
      items: 168,
      value: `${currency}103K`,
      percentage: 11
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-slate-500">Organize inventory by movement speed and performance</p>
        </div>
        <button className="hidden sm:flex items-center gap-2 bg-[#0F172A] text-white px-4 h-10 rounded-lg font-bold text-xs hover:bg-slate-800 transition-all shadow-sm shrink-0">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {categories.map((category, index) => (
          <CategoryCard 
            key={index}
            {...category}
          />
        ))}

        {/* Add Category Card (Mobile placeholder) */}
        <button className="sm:hidden w-full h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all">
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm">Add Category</span>
        </button>
      </div>
    </div>
  );
}
